'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { getApiKeys, createApiKey } from '@/lib/data/store';
import { ApiKey } from '@/types';
import { showToast } from '@/components/ui/Toast';

interface BackTapSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function BackTapSetupModal({ isOpen, onClose, userEmail }: BackTapSetupModalProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    async function loadKey() {
      if (!isOpen) return;
      const keys = await getApiKeys();
      if (keys.length > 0) {
        setApiKey(keys[0].key_hash);
      } else {
        const created = await createApiKey('iPhone Back Tap');
        setApiKey(created.key_hash);
      }
    }
    loadKey();
  }, [isOpen]);

  if (!isOpen) return null;

  const endpointUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/expenses/quick`
      : 'https://your-domain.vercel.app/api/expenses/quick';

  const endpointUrlWithKey = apiKey ? `${endpointUrl}?api_key=${apiKey}` : endpointUrl;

  const copyText = (text: string, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    showToast('Copied to clipboard ✓', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  iPhone Back Tap Setup
                </h3>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  &lt; 5s Flow
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log expenses by double-tapping the back of your iPhone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Indicators */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className={`py-1.5 rounded-xl text-xs font-bold text-center border transition-all ${
                activeStep === step
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              Step {step}
            </button>
          ))}
        </div>

        {/* Step 1: Webhook URL */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 1: Your Personal Endpoint
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Copy your unique Webhook URL
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your iPhone Shortcut will send amounts and categories to this endpoint in your database.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">1-Click URL (Includes Key, No Headers Needed!)</span>
                <button
                  onClick={() => copyText(endpointUrlWithKey, false)}
                  className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy 1-Click URL'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 break-all select-all">
                {endpointUrlWithKey}
              </div>
            </div>

            <button
              onClick={() => setActiveStep(2)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              <span>Next: Copy Your Personal API Key</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Personal API Key */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 2: Personal Authorization Key
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Copy your personal API Key
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                (Optional if you copied the 1-Click URL in Step 1, or used if adding an <code>x-api-key</code> header).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>Personal x-api-key</span>
                <button
                  onClick={() => copyText(apiKey, true)}
                  className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 break-all select-all font-bold text-emerald-600 dark:text-emerald-400">
                {apiKey || 'fintrack_sec_loading...'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveStep(1)}
                className="py-3 px-4 rounded-2xl border text-xs font-semibold text-slate-600"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                <span>Next: Create iOS Shortcut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Apple Shortcut Configuration */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 3: Create Shortcut on iPhone
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Add actions in the Apple Shortcuts app
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Open the native <strong>Shortcuts</strong> app on your iPhone, tap <strong>+</strong>, and add:
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Ask for Input</span>
                </div>
                <p className="text-slate-500 pl-6">
                  Set input type to <strong>Number</strong> with prompt <code>&quot;Amount ₹&quot;</code>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Choose from List</span>
                </div>
                <p className="text-slate-500 pl-6">
                  Add categories: <code>Food, Transport, Shopping, Bills, Other</code>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Get Contents of URL</span>
                </div>
                <div className="text-slate-500 pl-6 space-y-1">
                  <p>• URL: Paste your <strong>1-Click URL</strong> from Step 1 (or Webhook URL)</p>
                  <p>• Method: <strong>POST</strong></p>
                  <p>• Header (if using base URL): <code>x-api-key</code> → Paste <strong>API Key</strong></p>
                  <p>• Request Body: <strong>JSON</strong></p>
                  <p className="pl-3 text-slate-600 dark:text-slate-300">
                    - <code>amount</code> (Number): <strong>Provided Input</strong><br/>
                    - <code>category</code> (Text): <strong>Chosen Item</strong>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Show Notification (Live Server Confirmation)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-6">
                  Select <strong>Show Notification</strong> and tap its text box to set it to <strong>Contents of URL</strong>. Your iPhone will now display the exact server confirmation (e.g. <em>&quot;Expense added ✓: ₹100 for Food&quot;</em>)!
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveStep(2)}
                className="py-3 px-4 rounded-2xl border text-xs font-semibold text-slate-600"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                <span>Next: Enable iPhone Back Tap</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Back Tap Activation */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 4: Enable Double-Tap on iPhone
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Map shortcut to iPhone Back Tap
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Final 20-second step in your iOS Settings:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>On your iPhone:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <li>Open <strong>Settings</strong></li>
                <li>Tap <strong>Accessibility</strong> → <strong>Touch</strong></li>
                <li>Scroll to the bottom and select <strong>Back Tap</strong></li>
                <li>Choose <strong>Double Tap</strong> (or Triple Tap)</li>
                <li>Select your <strong>finTrack Shortcut</strong>!</li>
              </ol>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                All spending is securely recorded into your account in the central database.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              <span>Done! Back to App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
