'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import Image from 'next/image';

export default function NowPlayingScreen() {
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
    queue,
    playSong,
    toggleLike,
    isLiked,
    setActiveTab,
  } = useMusic();

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const liked = isLiked(currentSong.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Đang phát từ TikTok
        </h2>
        <button
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#161F36] transition-colors"
          title="Chia sẻ"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Player Display Box */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141C33] via-[#10172B] to-[#0A0D18] border border-[#222E52]/80 p-6 sm:p-10 shadow-2xl flex flex-col items-center">
        {/* Glow ambient background based on track */}
        <div className="absolute top-1/4 w-72 h-72 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 w-60 h-60 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Large Album Artwork */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl shadow-[#8B5CF6]/30 border-2 border-white/10 mb-8 group">
          <Image
            src={currentSong.coverUrl}
            alt={currentSong.title}
            fill
            sizes="256px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Title & Artist & Favorite */}
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentSong.title}
            </h1>
            <p className="text-base text-slate-400 font-medium">{currentSong.artist}</p>
          </div>
          <button
            onClick={() => toggleLike(currentSong.id)}
            className={`p-3 rounded-full backdrop-blur-md transition-all ${
              liked
                ? 'bg-[#FE2C55]/20 text-[#FE2C55] scale-110'
                : 'bg-[#161F36] text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-[#FE2C55]' : ''}`} />
          </button>
        </div>

        {/* Progress Slider */}
        <div className="w-full max-w-md space-y-2 mb-6">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              seek(clickPos * duration);
            }}
            className="w-full h-2 bg-[#1B2544] hover:h-2.5 rounded-full cursor-pointer relative transition-all group"
          >
            <div
              className="h-full bg-gradient-to-r from-[#25F4EE] via-[#8B5CF6] to-[#FE2C55] rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls (Shuffle, Prev, Play/Pause, Next, Repeat) */}
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-colors ${
              isShuffle ? 'text-[#25F4EE]' : 'text-slate-400 hover:text-white'
            }`}
            title="Trộn bài"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={playPrevious}
            className="p-2.5 text-slate-200 hover:text-white hover:scale-110 transition-all"
            title="Bài trước"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Big Circular Purple Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-[#8B5CF6]/40 transition-all"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-2.5 text-slate-200 hover:text-white hover:scale-110 transition-all"
            title="Bài tiếp"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2.5 rounded-full transition-colors ${
              isRepeat ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-white'
            }`}
            title="Lặp lại"
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Bar */}
        <div className="flex items-center gap-3 w-full max-w-xs text-slate-400">
          <button onClick={toggleMute} className="hover:text-white transition-colors">
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
            className="w-full accent-[#8B5CF6] h-1.5 bg-[#1B2544] rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Section: Danh sách phát liên quan */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Danh sách phát liên quan
        </h3>

        <div className="space-y-2 bg-[#121829]/90 border border-[#222E52]/80 rounded-2xl p-3 sm:p-4 shadow-xl">
          {queue.slice(0, 5).map((song) => {
            const isPlayingThis = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isPlayingThis
                    ? 'bg-[#182138] border border-[#8B5CF6]/50 text-white font-semibold'
                    : 'hover:bg-[#161F36] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#0A0D18]">
                    <Image
                      src={song.coverUrl}
                      alt={song.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <p className={`text-sm truncate ${isPlayingThis ? 'text-[#8B5CF6]' : 'text-white'}`}>
                      {song.title} - {song.artist}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-medium pl-3">
                  {song.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
