'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import Image from 'next/image';

export default function BottomPlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    volume,
    setVolumeLevel,
    isMuted,
    toggleMute,
    toggleLike,
    isLiked,
    activeTab,
    setActiveTab,
  } = useMusic();

  if (!currentSong || activeTab === 'player') return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isLiked(currentSong.id);

  return (
    <div className="fixed bottom-0 md:bottom-0 left-0 right-0 z-30 bg-[#0B0E17]/95 backdrop-blur-xl border-t border-[#1B2544] px-4 py-3 pb-16 md:pb-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Song Info */}
        <div
          onClick={() => setActiveTab('player')}
          className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial cursor-pointer group"
        >
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#161F36] ring-1 ring-white/10 group-hover:ring-[#8B5CF6] transition-all">
            <Image
              src={currentSong.coverUrl}
              alt={currentSong.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 truncate">
            <h4 className="text-sm font-bold text-white truncate group-hover:text-[#8B5CF6] transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-xs text-slate-400 truncate">{currentSong.artist}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentSong.id);
            }}
            className={`p-2 rounded-full transition-colors hidden sm:block ${
              liked ? 'text-[#FE2C55]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-[#FE2C55]' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center flex-1 max-w-xl px-2">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 transition-colors hidden sm:block ${
                isShuffle ? 'text-[#25F4EE]' : 'text-slate-400 hover:text-white'
              }`}
              title="Trộn bài"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrevious}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Bài trước"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#7C3AED]/40 transition-all"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Bài tiếp"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-1.5 transition-colors hidden sm:block ${
                isRepeat ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-white'
              }`}
              title="Lặp lại"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Slider */}
          <div className="w-full flex items-center gap-2.5 text-[11px] text-slate-400 font-medium">
            <span className="w-8 text-right hidden sm:inline">{formatTime(currentTime)}</span>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                seek(clickPos * duration);
              }}
              className="flex-1 h-1.5 bg-[#1B2544] hover:h-2 rounded-full cursor-pointer relative group transition-all"
            >
              <div
                className="h-full bg-gradient-to-r from-[#25F4EE] to-[#8B5CF6] rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="w-8 hidden sm:inline">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Expand View */}
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#FE2C55]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
            className="w-20 accent-[#8B5CF6] h-1.5 bg-[#1B2544] rounded-lg cursor-pointer"
          />

          <button
            onClick={() => setActiveTab('player')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#161F36] transition-colors"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
