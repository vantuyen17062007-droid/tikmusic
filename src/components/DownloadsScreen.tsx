'use client';

import React from 'react';
import { Download, Play, CheckCircle2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import Image from 'next/image';

export default function DownloadsScreen() {
  const { downloadHistory, playSong } = useMusic();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2544]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Danh sách bài hát đã tải xuống
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Nghe offline các bài hát TikTok với chất lượng cao nhất
          </p>
        </div>
      </div>

      {downloadHistory.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#121829]/50 rounded-2xl border border-[#222E52]/40">
          <Download className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Chưa có bài hát nào được tải</h3>
          <p className="text-sm text-slate-400">
            Dán link TikTok hoặc bấm nút &quot;Tải nhạc&quot; ở các bài hát để lưu về máy ngay!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloadHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#121829] hover:bg-[#161F36] border border-[#222E52]/60 transition-all duration-200"
            >
              <div
                onClick={() => playSong(item.song)}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#0B0E17]">
                  <Image
                    src={item.song.coverUrl}
                    alt={item.song.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate hover:text-[#8B5CF6]">
                    {item.song.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{item.song.artist}</span>
                    <span>•</span>
                    <span className="text-[#25F4EE]">{item.quality}</span>
                    <span>•</span>
                    <span>{item.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoàn tất</span>
                </span>
                <button
                  onClick={() => playSong(item.song)}
                  className="p-2 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
                  title="Phát nhạc"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
