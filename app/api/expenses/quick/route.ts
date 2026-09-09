import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '@/lib/data/initialData';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const searchParams = request.nextUrl.searchParams;
    const apiKeyParam = searchParams.get('api_key') || searchParams.get('key');
    const apiKey = request.headers.get('x-api-key') || apiKeyParam;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let userId = 'user_default';
    let isAuthorized = false;

    if (isSupabaseConfigured()) {
      const supabase = await createClientServer();
      
      if (bearerToken) {
        // Authenticate via Supabase Auth session token
        const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
        if (!error && user) {
          userId = user.id;
          isAuthorized = true;
        }
      }

      if (!isAuthorized && apiKey) {
        // Authenticate via API Key stored in api_keys table
        const { data, error } = await supabase
          .from('api_keys')
          .select('user_id')
          .eq('key_hash', apiKey)
          .single();
        if (!error && data) {
          userId = data.user_id;
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please provide a valid API key in x-api-key header or ?api_key= query parameter.' },
          { status: 401 }
        );
      }
    } else {
      // Local/Demo Mode authorization
      // Accepts standard demo key or any key starting with fintrack_
      if (!apiKey && !bearerToken) {
        return NextResponse.json(
          { success: false, error: 'API key required in x-api-key header.' },
          { status: 401 }
        );
      }
      isAuthorized = true;
    }

    // 2. Parse & Validate Payload
    const body = await request.json().catch(() => ({}));
    const rawAmount = body.amount;
    const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount || '0'));

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a valid number greater than 0.' },
        { status: 400 }
      );
    }

    // Resolve Category (supports ID or Name like "Food", "Transport")
    const categoryInput = String(body.category_id || body.category || 'Other').trim();
    let categoryId = categoryInput;
    let matchedCategory = DEFAULT_CATEGORIES.find(
      (c) => c.id.toLowerCase() === categoryInput.toLowerCase() || c.name.toLowerCase() === categoryInput.toLowerCase()
    );

    if (matchedCategory) {
      categoryId = matchedCategory.id;
    }

    // Resolve Payment Method (default to UPI if unspecified)
    const paymentInput = String(body.payment_method_id || body.payment_method || 'UPI').trim();
    let paymentMethodId = paymentInput;
    let matchedPM = DEFAULT_PAYMENT_METHODS.find(
      (p) => p.id.toLowerCase() === paymentInput.toLowerCase() || p.name.toLowerCase() === paymentInput.toLowerCase()
    );
    if (matchedPM) {
      paymentMethodId = matchedPM.id;
    }

    // Date
    const todayStr = new Date().toISOString().split('T')[0];
    const expenseDate = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayStr;
    const merchant = body.merchant ? String(body.merchant).substring(0, 100) : null;
    const note = body.note ? String(body.note).substring(0, 200) : null;

    // 3. Insert Expense
    if (isSupabaseConfigured()) {
      const supabase = await createClientServer();
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount,
          category_id: categoryId,
          payment_method_id: paymentMethodId,
          merchant,
          note,
          expense_date: expenseDate,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to record expense in database.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Expense added ✓',
        expense: data,
      });
    }

    // Local/Demo Mode Return
    const createdExpense = {
      id: 'exp-shortcut-' + Date.now(),
      amount,
      category_id: categoryId,
      category_name: matchedCategory ? matchedCategory.name : 'Other',
      payment_method_id: paymentMethodId,
      payment_method_name: matchedPM ? matchedPM.name : 'UPI',
      merchant,
      note,
      expense_date: expenseDate,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Expense added ✓',
      expense: createdExpense,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
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
    sample_payload: {
      amount: 350,
      category: 'Food',
      payment_method: 'UPI',
      merchant: 'Dinner',
      note: 'Quick entry',
    },
    categories: DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
  });
}
