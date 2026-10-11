'use client';

import React from 'react';
import { Play, Pause, Download, Heart, ListPlus } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import Image from 'next/image';
import TikTokIcon from './TikTokIcon';

interface TrendingMusicProps {
  songs: Song[];
}

export default function TrendingMusic({ songs }: TrendingMusicProps) {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    openDownloadModal,
    openAddToPlaylistModal,
    toggleLike,
    isLiked,
    setActiveTab,
  } = useMusic();

  const handleCardClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, songs);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, song: Song) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(song);
    }
  };

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Nhạc hot hôm nay</h2>
        </div>
        <button
          onClick={() => setActiveTab('explore')}
          className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 group cursor-pointer"
        >
          <span>Xem tất cả</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Grid of Song Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {songs.map((song) => {
          const isCurrent = currentSong?.id === song.id;
          const isThisPlaying = isCurrent && isPlaying;
          const liked = isLiked(song.id);

          return (
            <div
              key={song.id}
              className={`group relative bg-[#121829] hover:bg-[#182138] border ${
                isCurrent ? 'border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20' : 'border-[#222E52]/70 hover:border-[#8B5CF6]/50'
              } rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Artwork Container */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(song)}
                onKeyDown={(e) => handleKeyDown(e, song)}
                aria-label={`Phát bài hát ${song.title} - ${song.artist}`}
                className="relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer mb-3 bg-[#090C15] outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                <Image
                  src={song.coverUrl}
                  alt={song.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient shade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Duration Tag */}
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white/90 px-1.5 py-0.5 rounded-md">
                  {song.duration}
                </span>

                {/* Play Button Overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                    isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-xl shadow-[#7C3AED]/50 transform scale-90 group-hover:scale-100 transition-transform">
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song.id);
                  }}
                  title={liked ? 'Bỏ thích' : 'Thích bài hát'}
                  aria-label={liked ? 'Bỏ thích' : 'Thích bài hát'}
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                    liked
                      ? 'bg-[#FE2C55]/20 text-[#FE2C55]'
                      : 'bg-black/40 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#FE2C55]' : ''}`} />
                </button>
              </div>

              {/* Title & Artist & TikTok Badge */}
              <div className="space-y-1">
                <h3
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(song)}
                  onKeyDown={(e) => handleKeyDown(e, song)}
                  title={song.title}
                  className="font-bold text-sm text-white truncate cursor-pointer hover:text-[#8B5CF6] transition-colors outline-none focus:text-[#8B5CF6]"
                >
                  {song.title}
                </h3>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate">{song.artist}</p>

                  {/* F3: TikTok Icon Badge using shared component */}
                  <div
                    title="Âm thanh từ TikTok"
                    className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tải nhạc & Thêm vào playlist */}
              <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  type="button"
                  onClick={() => openDownloadModal(song)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#1B2544]/60 hover:bg-[#6D28D9] text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Tải bài hát"
                  aria-label="Tải bài hát"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddToPlaylistModal(song)}
                  className="p-1.5 rounded-lg bg-[#1B2544]/60 hover:bg-[#8B5CF6] text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Thêm vào danh sách phát"
                  aria-label="Thêm vào danh sách phát"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
