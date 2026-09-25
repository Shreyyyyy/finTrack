import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/lib/data/initialData';
import { addShortcutLog } from '@/lib/logging/requestLogs';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

// Helper to get an admin Supabase client if service role key is present
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

function parseNaturalExpense(text: string) {
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d+)?)/i);
  const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : NaN;
  const cleanText = text.replace(amountMatch ? amountMatch[0] : '', '').trim();
  const lower = cleanText.toLowerCase();

  let type: 'expense' | 'income' = 'expense';
  let category = 'Other';

  if (/salary|payroll|paycheck|wages|stipend/i.test(lower)) {
    category = 'Salary';
    type = 'income';
  } else if (/freelance|upwork|fiverr|consulting|client/i.test(lower)) {
    category = 'Freelance & Consulting';
    type = 'income';
  } else if (/refund|cashback|reimbursement|repay/i.test(lower)) {
    category = 'Refunds & Cashbacks';
    type = 'income';
  } else if (/dividend|interest|yield|stocks|mutual fund|sip|crypto|gold|invest/i.test(lower)) {
    if (/dividend|interest|yield|gain|profit/i.test(lower)) {
      category = 'Investments & Dividends';
      type = 'income';
    } else {
      category = 'Investment';
    }
  } else if (/rent received|rental income/i.test(lower)) {
    category = 'Rental Income';
    type = 'income';
  } else if (/credited|credit|received|deposited|deposit|income/i.test(lower)) {
    category = 'Other Income';
    type = 'income';
  } else if (/food|lunch|dinner|breakfast|snack|coffee|tea|cafe|burger|pizza|zomato|swiggy|chai|starbucks|mcdonalds|subway|restaurant|eat/i.test(lower)) {
    category = 'Food & Dining';
  } else if (/uber|ola|cab|auto|metro|petrol|diesel|fuel|bus|train|flight|transport|taxi|rapido/i.test(lower)) {
    category = 'Transportation';
  } else if (/amazon|flipkart|shopping|clothes|shoes|myntra|zara|h&m/i.test(lower)) {
    category = 'Shopping';
  } else if (/electricity|wifi|internet|bill|recharge|water|gas|rent|maintenance|jio|airtel/i.test(lower)) {
    category = 'Bills & Utilities';
  } else if (/grocery|groceries|blinkit|zepto|instamart|milk|vegetables|fruits|supermarket/i.test(lower)) {
    category = 'Groceries';
  } else if (/movie|cinema|netflix|spotify|game|party|club|prime/i.test(lower)) {
    category = 'Entertainment';
  } else if (/doctor|medicine|pharmacy|hospital|gym|health|fitness/i.test(lower)) {
    category = 'Health & Medical';
  }

  let paymentMethod = 'UPI';
  if (/cash/i.test(lower)) paymentMethod = 'Cash';
  else if (/card|credit card|debit/i.test(lower)) paymentMethod = 'Credit Card';

  return {
    amount: parsedAmount,
    category,
    paymentMethod,
    type,
    note: cleanText || category,
  };
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKeyParam = searchParams.get('api_key') || searchParams.get('key');
  const apiKey = (request.headers.get('x-api-key') || apiKeyParam || '').trim();
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const trace = {
    supabaseConfigured: isSupabaseConfigured(),
    rpcAttempted: false,
    rpcError: null as string | null,
    apiKeysQueryError: null as string | null,
    profilesQueryError: null as string | null,
    resolvedUserId: null as string | null,
    insertError: null as string | null,
  };

  const body = await request.json().catch(() => ({}));

  // Support smart single-string inputs like "250 lunch" or "₹150 coffee starbucks"
  const naturalInput = body.text || body.query || body.input || (typeof body.amount === 'string' && /[a-zA-Z]/.test(body.amount) ? body.amount : null);
  const parsed = naturalInput ? parseNaturalExpense(String(naturalInput)) : null;

  const rawAmount = parsed && !isNaN(parsed.amount) ? parsed.amount : body.amount;
  const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount || '0'));
  const categoryInput = String(body.category_id || body.category || (parsed ? parsed.category : 'Other')).trim();
  const paymentInput = String(body.payment_method_id || body.payment_method || (parsed ? parsed.paymentMethod : 'UPI')).trim();
  const todayStr = new Date().toISOString().split('T')[0];
  const expenseDate = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayStr;
  const merchant = body.merchant ? String(body.merchant).substring(0, 100) : null;
  const rawNote = body.note ? String(body.note).substring(0, 200) : (parsed ? parsed.note : null);

  const isIncome =
    body.type === 'income' ||
    body.is_income === true ||
    parsed?.type === 'income' ||
    /salary|freelance|consulting|dividend|refund|cashback|rental income|other income/i.test(categoryInput) ||
    /credit|credited|salary|freelance|cashback|refund|received|deposit|deposited/i.test(naturalInput || '');

  const finalNote = isIncome
    ? (rawNote ? (rawNote.includes('[INCOME]') ? rawNote : `[INCOME] ${rawNote}`) : `[INCOME] ${categoryInput}`)
    : (rawNote || categoryInput);

  const logFinish = (statusCode: number, success: boolean, message?: string, error?: string) => {
    addShortcutLog({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      method: 'POST',
      url: request.nextUrl.pathname + request.nextUrl.search,
      apiKeyUsed: apiKey,
      amount,
      category: categoryInput,
      paymentMethod: paymentInput,
      note: finalNote,
      statusCode,
      success,
      message,
      error,
      trace,
    });
  };

  try {
    if (isNaN(amount) || amount <= 0) {
      logFinish(400, false, undefined, 'Amount must be a valid number greater than 0.');
      return NextResponse.json(
        { success: false, error: 'Amount must be a valid number greater than 0.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Local/Demo Mode Return
      if (!apiKey && !bearerToken) {
        logFinish(401, false, undefined, 'API key required in demo mode.');
        return NextResponse.json(
          { success: false, error: 'API key required. Please provide x-api-key header or ?api_key= parameter.' },
          { status: 401 }
        );
      }
      const matchedCat = DEFAULT_CATEGORIES.find(
        (c) => c.id.toLowerCase() === categoryInput.toLowerCase() || c.name.toLowerCase() === categoryInput.toLowerCase()
      );
      const matchedPm = DEFAULT_PAYMENT_METHODS.find(
        (p) => p.id.toLowerCase() === paymentInput.toLowerCase() || p.name.toLowerCase() === paymentInput.toLowerCase()
      );

      const categoryName = matchedCat ? matchedCat.name : categoryInput;
      const msg = isIncome
        ? `Income credited ✓: ₹${amount.toLocaleString('en-IN')} for ${categoryName}`
        : `Expense added ✓: ₹${amount.toLocaleString('en-IN')} for ${categoryName}`;
      logFinish(200, true, msg);
      return NextResponse.json({
        success: true,
        message: msg,
        type: isIncome ? 'income' : 'expense',
        expense: {
          id: 'exp-shortcut-' + Date.now(),
          amount,
          type: isIncome ? 'income' : 'expense',
          category_id: matchedCat ? matchedCat.id : (isIncome ? 'cat-inc-1' : 'cat-1'),
          category_name: categoryName,
          payment_method_id: matchedPm ? matchedPm.id : 'pm-1',
          payment_method_name: matchedPm ? matchedPm.name : paymentInput,
          merchant,
          note: finalNote,
          expense_date: expenseDate,
          created_at: new Date().toISOString(),
        },
      });
    }

    // --- Supabase Configured Mode ---
    const adminSupabase = getAdminSupabaseClient();
    const serverSupabase = await createClientServer();
    const supabase = adminSupabase || serverSupabase;

    // Strategy A: Dedicated RPC function log_quick_expense (Fastest & Bypasses RLS with SECURITY DEFINER)
    if (apiKey) {
      trace.rpcAttempted = true;
      try {
        const { data: rpcData, error: rpcError } = await serverSupabase.rpc('log_quick_expense', {
          p_api_key: apiKey,
          p_amount: amount,
          p_category: categoryInput,
          p_payment: paymentInput,
          p_note: finalNote,
          p_merchant: merchant,
          p_date: expenseDate,
        });

        if (rpcError) {
          trace.rpcError = `${rpcError.code}: ${rpcError.message}`;
        } else if (rpcData) {
          if (rpcData.success) {
            const returnedMsg = isIncome
              ? `Income credited ✓: ₹${amount.toLocaleString('en-IN')} for ${categoryInput}`
              : rpcData.message;
            logFinish(200, true, returnedMsg);
            return NextResponse.json({
              ...rpcData,
              message: returnedMsg,
              type: isIncome ? 'income' : 'expense',
            });
          } else {
            logFinish(401, false, undefined, rpcData.error);
            return NextResponse.json(rpcData, { status: 401 });
          }
        }
      } catch (err: unknown) {
        trace.rpcError = err instanceof Error ? err.message : String(err);
      }
    }

    // Strategy B: Authenticate via Bearer Token, API Key lookup, or Admin Client
    let userId: string | null = null;

    if (bearerToken) {
      const { data: { user }, error } = await serverSupabase.auth.getUser(bearerToken);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!userId && apiKey) {
      // Look up key in api_keys table
      const { data: keyRow, error: kErr } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', apiKey)
        .maybeSingle();

      if (kErr) {
        trace.apiKeysQueryError = `${kErr.code}: ${kErr.message}`;
      }

      if (keyRow?.user_id) {
        userId = keyRow.user_id;
      } else if (apiKey.startsWith('fintrack_sec_') || apiKey.startsWith('fintrack_')) {
        // Fallback to primary registered profile in database
        const { data: primaryProfile, error: pErr } = await supabase
          .from('profiles')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (pErr) {
          trace.profilesQueryError = `${pErr.code}: ${pErr.message}`;
        }

        if (primaryProfile?.id) {
          userId = primaryProfile.id;
          try {
            await supabase
              .from('api_keys')
              .upsert({ user_id: userId, name: 'iPhone Back Tap (Auto)', key_hash: apiKey }, { onConflict: 'key_hash' });
          } catch {
            // Ignore if upsert blocked by permissions
          }
        }
      }
    }

    trace.resolvedUserId = userId;

    if (!userId) {
      const err = 'Unauthorized. API key not recognized.';
      logFinish(401, false, undefined, `${err} (RPC Error: ${trace.rpcError || 'None'}, api_keys Error: ${trace.apiKeysQueryError || 'None'})`);
      return NextResponse.json(
        {
          success: false,
          error: err,
          instructions: 'Please copy your personal API key from finTrack Settings or run the Supabase SQL migration to enable shortcut access.',
          trace,
        },
        { status: 401 }
      );
    }

    // Resolve Category UUID
    let finalCategoryId: string | null = null;
    const matchedCategory = DEFAULT_CATEGORIES.find(
      (c) => c.id.toLowerCase() === categoryInput.toLowerCase() || c.name.toLowerCase() === categoryInput.toLowerCase()
    );

    if (isUUID(categoryInput)) {
      finalCategoryId = categoryInput;
    } else {
      const targetName = matchedCategory ? matchedCategory.name : categoryInput;
      const { data: dbCat } = await supabase
        .from('categories')
        .select('id')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .ilike('name', `%${targetName}%`)
        .limit(1)
        .maybeSingle();

      if (dbCat?.id && isUUID(dbCat.id)) {
        finalCategoryId = dbCat.id;
      }
    }

    // Resolve Payment Method UUID
    let finalPaymentMethodId: string | null = null;
    const matchedPM = DEFAULT_PAYMENT_METHODS.find(
      (p) => p.id.toLowerCase() === paymentInput.toLowerCase() || p.name.toLowerCase() === paymentInput.toLowerCase()
    );

    if (isUUID(paymentInput)) {
      finalPaymentMethodId = paymentInput;
    } else {
      const targetPm = matchedPM ? matchedPM.name : paymentInput;
      const { data: dbPm } = await supabase
        .from('payment_methods')
        .select('id')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .ilike('name', `%${targetPm}%`)
        .limit(1)
        .maybeSingle();

      if (dbPm?.id && isUUID(dbPm.id)) {
        finalPaymentMethodId = dbPm.id;
      }
    }

    // Insert Expense Record
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount,
        category_id: finalCategoryId,
        payment_method_id: finalPaymentMethodId,
        merchant,
        note: finalNote,
        expense_date: expenseDate,
      })
      .select()
      .single();

    if (insertError) {
      trace.insertError = `${insertError.code}: ${insertError.message}`;
      logFinish(500, false, undefined, `Database insert error: ${insertError.message}`);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${insertError.message}. Please run the Supabase SQL migration.`,
          trace,
        },
        { status: 500 }
      );
    }

    const categoryDisplayName = matchedCategory ? matchedCategory.name : categoryInput;
    const successMsg = isIncome
      ? `Income credited ✓: ₹${amount.toLocaleString('en-IN')} for ${categoryDisplayName}`
      : `Expense added ✓: ₹${amount.toLocaleString('en-IN')} for ${categoryDisplayName}`;
    logFinish(200, true, successMsg);

    return NextResponse.json({
      success: true,
      message: successMsg,
      type: isIncome ? 'income' : 'expense',
      expense: {
        ...newExpense,
        type: isIncome ? 'income' : 'expense',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    logFinish(500, false, undefined, message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET handler to let Apple Shortcut inspect categories easily
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/expenses/quick',
    method: 'POST',
    required_headers: {
      'x-api-key': 'Your API Key',
      'Content-Type': 'application/json',
    },
    sample_payload_expense: {
      amount: 350,
      category: 'Food & Dining',
      payment_method: 'UPI',
      note: 'Dinner with friends',
    },
    sample_payload_credit_income: {
      amount: 50000,
      category: 'Salary',
      type: 'income',
      payment_method: 'Net Banking',
      note: 'Monthly salary credited',
    },
    sample_payload_natural_text: {
      text: '5000 salary' /* or 'credited 2500 freelance', '250 coffee' */,
    },
    categories: DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon })),
  });
}
