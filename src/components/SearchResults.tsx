'use client';

import React from 'react';
import { Download, Play, Pause, Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import Image from 'next/image';

export default function SearchResults() {
  const {
    searchQuery,
    searchResults,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    openDownloadModal,
  } = useMusic();

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2544]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Kết quả tìm kiếm cho &ldquo;<span className="text-[#8B5CF6]">{searchQuery || 'sơn tùng'}</span>&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tìm thấy {searchResults.length} bài hát phù hợp
          </p>
        </div>
      </div>

      {searchResults.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#121829]/50 rounded-2xl border border-[#222E52]/40">
          <Music2 className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Không tìm thấy bài hát nào</h3>
          <p className="text-sm text-slate-400">
            Hãy thử tìm với từ khoá khác như &quot;Sơn Tùng&quot;, &quot;RHYDER&quot;, hoặc dán link TikTok!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {searchResults.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                className={`group flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-200 border ${
                  isCurrent
                    ? 'bg-[#182138] border-[#8B5CF6]/80 shadow-md shadow-[#8B5CF6]/10'
                    : 'bg-[#121829] hover:bg-[#161F36] border-[#222E52]/60 hover:border-[#8B5CF6]/40'
                }`}
              >
                {/* Left: Thumbnail & Info */}
                <div
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-[#0B0E17]">
                    <Image
                      src={song.coverUrl}
                      alt={song.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-current" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate group-hover:text-[#8B5CF6] transition-colors">
                      {song.artist} - {song.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{song.artist}</span>
                      <span>•</span>
                      <span>{song.duration}</span>
                      {song.tiktokViews && (
                        <>
                          <span>•</span>
                          <span className="text-[#25F4EE]">{song.tiktokViews} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Download Button */}
                <div className="flex items-center gap-2 pl-3">
                  <button
                    onClick={() => openDownloadModal(song)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#7C3AED]/30 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải nhạc</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
