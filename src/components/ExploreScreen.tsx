'use client';

import React from 'react';
import { TrendingUp, Sparkles, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { MOCK_SONGS } from '../data/mockData';
import TrendingMusic from './TrendingMusic';

export default function ExploreScreen() {
  const { handleSearch } = useMusic();

  const categories = [
    { name: 'TikTok Trend 2024', count: '150+ bài', color: 'from-[#FE2C55] to-[#FF007F]' },
    { name: 'V-Pop Hot Hits', count: '90+ bài', color: 'from-[#8B5CF6] to-[#6D28D9]' },
    { name: 'Rap Việt On Top', count: '65+ bài', color: 'from-[#25F4EE] to-[#0070F3]' },
    { name: 'Acoustic & Chill', count: '80+ bài', color: 'from-[#F59E0B] to-[#D97706]' },
    { name: 'Remix Vinahouse', count: '120+ bài', color: 'from-[#EC4899] to-[#8B5CF6]' },
    { name: 'US-UK Viral', count: '110+ bài', color: 'from-[#10B981] to-[#059669]' },
  ];

  return (
    <div className="space-y-8">
      {/* Explore Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171F3B] to-[#261545] p-6 sm:p-8 border border-[#2D3A63] shadow-xl">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A855F7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thịnh hành trên TikTok</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Khám phá thế giới âm nhạc TikTok
          </h2>
          <p className="text-sm text-slate-300">
            Cập nhật liên tục những giai điệu đang gây bão, vũ đạo hot nhất và bài hát được tìm kiếm nhiều nhất.
          </p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#25F4EE]" />
          Chủ đề nổi bật
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => handleSearch(cat.name.split(' ')[0])}
              className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg flex flex-col justify-between h-28 group`}
            >
              <Music className="w-6 h-6 text-white/80 group-hover:rotate-12 transition-transform" />
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{cat.name}</h4>
                <p className="text-[11px] text-white/70 font-medium mt-0.5">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot Songs Grid */}
      <TrendingMusic songs={MOCK_SONGS} />
    </div>
  );
}
