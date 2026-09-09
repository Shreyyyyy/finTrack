'use client';

import React from 'react';
import { Users, User, ChevronDown } from 'lucide-react';
import { Profile } from '@/types';

interface PersonSelectorProps {
  profiles: Profile[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
}

export function PersonSelector({ profiles, selectedUserId, onSelectUser }: PersonSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <Users className="w-3.5 h-3.5 absolute left-3 pointer-events-none text-slate-400" />
        <select
          value={selectedUserId}
          onChange={(e) => onSelectUser(e.target.value)}
          className="appearance-none pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">👥 All Members (Combined)</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              👤 {p.display_name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-slate-400" />
      </div>
    </div>
  );
}
