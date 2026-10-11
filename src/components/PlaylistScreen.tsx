'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, Play, ListMusic, X, Check } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Playlist } from '../types';
import Image from 'next/image';

export default function PlaylistScreen() {
  const { playlists, createPlaylist, playSong } = useMusic();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2544]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Playlist của tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý và nghe danh sách nhạc yêu thích từ TikTok
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#7C3AED]/30 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo playlist mới</span>
        </button>
      </div>

      {/* Playlists List matching mockup */}
      <div className="space-y-3">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#121829] hover:bg-[#161F36] border border-[#222E52]/60 hover:border-[#8B5CF6]/50 transition-all duration-200"
          >
            {/* Left: Thumbnail and Details */}
            <div
              onClick={() => setSelectedPlaylist(playlist)}
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#0B0E17]">
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  fill
                  sizes="64px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(playlist);
                    }}
                    className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                  {playlist.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {playlist.songCount} bài hát
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayPlaylist(playlist)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B2544]/60 hover:bg-[#8B5CF6] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Phát</span>
              </button>
              <button
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1B2544] transition-colors"
                title="Tùy chọn"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Playlist Details Drawer/Modal */}
      {selectedPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#121829] border border-[#2D3A63] rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B2544]">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                  <Image
                    src={selectedPlaylist.coverUrl}
                    alt={selectedPlaylist.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPlaylist.name}</h3>
                  <p className="text-xs text-slate-400">{selectedPlaylist.songCount} bài hát</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#1C2642]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Songs in playlist */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedPlaylist.songs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Chưa có bài hát nào trong playlist này. Hãy thêm từ màn hình chính!
                </div>
              ) : (
                selectedPlaylist.songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      playSong(song);
                      setSelectedPlaylist(null);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#182138] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                        <Image
                          src={song.coverUrl}
                          alt={song.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{song.title}</p>
                        <p className="text-xs text-slate-400">{song.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{song.duration}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                handlePlayPlaylist(selectedPlaylist);
                setSelectedPlaylist(null);
              }}
              disabled={selectedPlaylist.songs.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Phát toàn bộ playlist</span>
            </button>
          </div>
        </div>
      )}

      {/* Create New Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <form
            onSubmit={handleCreate}
            className="relative w-full max-w-md bg-[#121829] border border-[#2D3A63] rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#8B5CF6]" />
                Tạo playlist mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#1C2642]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Tên danh sách phát
              </label>
              <input
                type="text"
                autoFocus
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="VD: Nhạc TikTok gây nghiện, Chill đêm..."
                className="w-full bg-[#0B0E17] border border-[#222E52] focus:border-[#8B5CF6] text-sm text-white placeholder-slate-400 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6]/30"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-sm font-semibold hover:bg-[#1B2544]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-sm font-semibold shadow-lg shadow-[#7C3AED]/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Tạo ngay</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
