import React from 'react';
import { ActiveTab } from '../types/game';
import { Coins, Crown, Landmark, ScrollText, Sparkles, Swords } from 'lucide-react';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenStore: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'missions', label: 'المهام', icon: ScrollText },
  { id: 'raids', label: 'المداهمات', icon: Swords },
  { id: 'skills', label: 'المهارات', icon: Sparkles },
  { id: 'hq', label: 'المقر السري', icon: Landmark },
  { id: 'economy', label: 'الاقتصاد', icon: Coins },
];

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onSelectTab, onOpenStore }) => {
  return (
    <header className="bg-[#0E1016] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => onSelectTab('missions')}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          صراع الفصائل والظلال
        </button>

        {/* Zone 2: 5 concise single-line nav links with icons */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 inline-flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-amber-400 border-amber-500'
                    : 'text-zinc-400 border-transparent hover:text-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenStore}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Crown className="w-4 h-4 shrink-0" />
            <span>متجر السيادة</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav className="md:hidden flex items-center justify-between gap-2 px-4 pb-2 overflow-x-auto border-t border-white/5 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                isActive ? 'bg-amber-600/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
