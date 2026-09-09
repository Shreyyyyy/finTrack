'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  X,
  Camera,
  Upload,
  User,
  Sparkles,
  Check,
  CreditCard,
  Mail,
  Trash2,
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Woman / Professional
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', // Young Man
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Man smiling
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', // Woman smiling
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', // Chill portrait
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', // Professional Man
];

const EMOJI_AVATARS = ['👨‍💼', '👩‍💼', '🧑‍💻', '👩‍🦰', '🧔', '👑', '⚡', '🚀'];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>('');
  const [defaultPayment, setDefaultPayment] = useState('UPI');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setDefaultPayment(profile.default_payment_method || 'UPI');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  // Compress & convert selected file to optimized Base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          showToast('Photo selected ✓', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Please enter a display name', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || undefined,
        default_payment_method: defaultPayment,
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Photo removed', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Your Profile
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage your name, profile photo, and preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6">
          {/* Avatar Preview & Upload Area */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-3xl">
                    {displayName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Quick camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-500 transition-transform active:scale-95"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Upload From Device</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Avatar Presets Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Or Choose a Preset Avatar</span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-transform active:scale-95 ${
                    avatarUrl === url
                      ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Emoji Avatars */}
            <div className="flex items-center justify-between gap-1 pt-2">
              {EMOJI_AVATARS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.fillStyle = '#10b981';
                      ctx.beginPath();
                      ctx.arc(64, 64, 64, 0, Math.PI * 2);
                      ctx.fill();
                      ctx.font = '64px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText(emoji, 64, 72);
                      setAvatarUrl(canvas.toDataURL('image/png'));
                    }
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg flex items-center justify-center transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Shrey, Sarah, Dad"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Identifier (Email or Username)</span>
              </label>
              <input
                type="text"
                value={user?.email || profile?.email || '—'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Default Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Default Payment Method</span>
              </label>
              <select
                value={defaultPayment}
                onChange={(e) => setDefaultPayment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
