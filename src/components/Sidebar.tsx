'use client';

import React from 'react';
import { Home, Compass, ListMusic, Download, Settings, Headphones } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { ActiveTab } from '../types';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useMusic();

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Trang chủ', icon: Home },
    { id: 'explore' as ActiveTab, label: 'Khám phá', icon: Compass },
    { id: 'playlist' as ActiveTab, label: 'Playlist của tôi', icon: ListMusic },
    { id: 'downloads' as ActiveTab, label: 'Tải xuống', icon: Download },
    { id: 'settings' as ActiveTab, label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B0E17]/95 border-r border-[#1B2544]/60 flex flex-col justify-between p-5 min-h-screen text-slate-200 select-none hidden md:flex shrink-0">
      <div>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-[2px] shadow-lg shadow-[#8B5CF6]/20 group-hover:shadow-[#8B5CF6]/40 transition-all">
            <div className="w-full h-full bg-[#0B0E17] rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.209 1.74 2.895 2.895 0 0 1 2.313-4.636c.298 0 .586.046.857.13V9.378a6.34 6.34 0 0 0-.857-.058 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.336-6.34V8.375a8.196 8.196 0 0 0 4.775 1.524V6.454a4.823 4.823 0 0 1-1-.068z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              TikMusic
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Tải nhạc từ TikTok - Nghe mọi lúc</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white shadow-lg shadow-[#7C3AED]/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#161F36]/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promotion Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121A33] via-[#172346] to-[#20153D] p-4 border border-[#8B5CF6]/20 shadow-xl group">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#FE2C55]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-[#25F4EE]/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/30">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Nhạc hay</h4>
            <p className="text-[11px] text-slate-400">Từ những video TikTok</p>
          </div>
        </div>

        {/* Sound Wave Decoration */}
        <div className="flex items-center gap-1 h-4 mt-3 px-1">
          <span className="w-1 bg-[#25F4EE] rounded-full h-2 animate-pulse" />
          <span className="w-1 bg-[#8B5CF6] rounded-full h-3.5 animate-pulse delay-75" />
          <span className="w-1 bg-[#FE2C55] rounded-full h-2 animate-pulse delay-150" />
          <span className="w-1 bg-[#A855F7] rounded-full h-4 animate-pulse delay-100" />
          <span className="w-1 bg-[#25F4EE] rounded-full h-2.5 animate-pulse delay-200" />
          <span className="w-1 bg-[#EC4899] rounded-full h-1.5 animate-pulse" />
          <span className="w-1 bg-[#8B5CF6] rounded-full h-3 animate-pulse delay-300" />
        </div>
      </div>
    </aside>
  );
}
