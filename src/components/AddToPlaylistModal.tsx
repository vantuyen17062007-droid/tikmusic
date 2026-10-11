'use client';

import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, ListMusic, Plus, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AddToPlaylistModal() {
  const {
    playlistModalOpen,
    songForPlaylist,
    closeAddToPlaylistModal,
    playlists,
    addSongToPlaylist,
    createPlaylist,
  } = useMusic();

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loadingPlId, setLoadingPlId] = useState<string | null>(null);

  if (!playlistModalOpen || !songForPlaylist) return null;

  const handleSelectPlaylist = async (playlistId: string) => {
    setLoadingPlId(playlistId);
    await addSongToPlaylist(playlistId, songForPlaylist);
    setLoadingPlId(null);
    closeAddToPlaylistModal();
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const ok = await createPlaylist(newPlaylistName.trim());
    if (ok) {
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121829] border border-[#2D3A63] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1B2544]">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="text-lg font-bold text-white">Thêm vào Playlist</h3>
          </div>
          <button
            onClick={closeAddToPlaylistModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#1C2642] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song info summary */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0B0E17] border border-[#1E294B]">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <Image
              src={songForPlaylist.coverUrl}
              alt={songForPlaylist.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{songForPlaylist.title}</p>
            <p className="text-xs text-slate-400 truncate">{songForPlaylist.artist}</p>
          </div>
        </div>

        {/* Existing Playlists list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              Bạn chưa có playlist nào. Hãy tạo playlist mới dưới đây!
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleSelectPlaylist(pl.id)}
                disabled={loadingPlId === pl.id}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161F36]/60 hover:bg-[#1C2849] border border-[#222E52]/60 hover:border-[#8B5CF6]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image src={pl.coverUrl} alt={pl.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-[#8B5CF6] truncate transition-colors">
                      {pl.name}
                    </p>
                    <p className="text-xs text-slate-400">{pl.songCount} bài hát</p>
                  </div>
                </div>
                {loadingPlId === pl.id ? (
                  <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Create new playlist toggle */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-3 pt-2 border-t border-[#1B2544]">
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nhập tên playlist mới..."
              className="w-full bg-[#0B0E17] border border-[#222E52] focus:border-[#8B5CF6] text-sm text-white px-4 py-2.5 rounded-xl outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] disabled:opacity-50 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tạo</span>
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#2D3A63] hover:border-[#8B5CF6] text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#8B5CF6]" />
            <span>Tạo playlist mới</span>
          </button>
        )}
      </div>
    </div>
  );
}
