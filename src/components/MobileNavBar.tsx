'use client';

import React from 'react';
import { Home, Compass, ListMusic, Settings } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { ActiveTab } from '../types';

export default function MobileNavBar() {
  const { activeTab, setActiveTab } = useMusic();

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'explore', label: 'Khám phá', icon: Compass },
    { id: 'playlist', label: 'Playlist', icon: ListMusic },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E17]/95 backdrop-blur-lg border-t border-[#1B2544] px-4 py-2 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-[#8B5CF6] font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                isActive ? 'bg-[#8B5CF6]/15' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
