'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, ListMusic, X, Check, Trash2, Music2, Sparkles } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Playlist, Song } from '../types';
import Image from 'next/image';

export default function PlaylistScreen() {
  const {
    playlists,
    samplePlaylists,
    createPlaylist,
    deletePlaylist,
    removeSongFromPlaylist,
    playSong,
    togglePlay,
    currentSong,
    isPlaying,
  } = useMusic();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  // B2: Khi chọn playlist thật của user, tải danh sách bài hát thực tế từ database
  useEffect(() => {
    if (!selectedPlaylist) {
      setPlaylistSongs([]);
      return;
    }

    // Nếu là playlist mẫu
    if (selectedPlaylist.id.startsWith('pl-1') || selectedPlaylist.id.startsWith('pl-2') || selectedPlaylist.id.startsWith('pl-3') || selectedPlaylist.id.startsWith('pl-4')) {
      setPlaylistSongs(selectedPlaylist.songs || []);
      return;
    }

    let isMounted = true;
    setIsLoadingSongs(true);
    fetch(`/api/playlists/${selectedPlaylist.id}/songs`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.songs)) {
          interface ServerPlaylistSong {
            song_id: string;
            title: string;
            artist: string;
            duration: string;
            cover_url: string;
            audio_url: string;
          }
          const loaded: Song[] = data.songs.map((s: ServerPlaylistSong) => ({
            id: s.song_id,
            title: s.title,
            artist: s.artist,
            duration: s.duration,
            durationSec: 180,
            coverUrl: s.cover_url,
            audioUrl: s.audio_url,
          }));
          setPlaylistSongs(loaded);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingSongs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPlaylist]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const ok = await createPlaylist(newPlaylistName.trim());
    if (ok) {
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa danh sách phát "${playlistName}"?`);
    if (confirmed) {
      await deletePlaylist(playlistId);
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
    }
  };

  const handlePlaySongInPlaylist = (song: Song) => {
    // D5: Đồng bộ nút Play: nếu là bài đang phát thì togglePlay()
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, playlistSongs.length > 0 ? playlistSongs : [song]);
    }
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
      setSelectedPlaylist(null);
    }
  };

  const handleRemoveSong = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    const ok = await removeSongFromPlaylist(selectedPlaylist.id, songId);
    if (ok.success) {
      setPlaylistSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1B2544]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Playlist của tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý và cá nhân hóa danh sách nhạc yêu thích trên TikMusic
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#7C3AED]/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo playlist mới</span>
        </button>
      </div>

      {/* Phần 1: Playlist thật của người dùng */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#8B5CF6]" />
          Danh sách phát cá nhân ({playlists.length})
        </h3>

        {playlists.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#121829]/60 border border-[#222E52]/40 text-center space-y-3">
            <Music2 className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              Bạn chưa có danh sách phát cá nhân nào
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Đăng nhập tài khoản và bấm &quot;Tạo playlist mới&quot; để lưu trữ các bài hát yêu thích từ TikTok.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-xs font-semibold text-[#A855F7] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo playlist đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#121829] hover:bg-[#161F36] border border-[#222E52]/60 hover:border-[#8B5CF6]/50 transition-all duration-200"
              >
                {/* Thumbnail & Title */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlaylist(playlist)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPlaylist(playlist);
                    }
                  }}
                  aria-label={`Xem danh sách phát ${playlist.name}`}
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer outline-none"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#0B0E17]">
                    <Image
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                      {playlist.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {playlist.songCount} bài hát • {playlist.updatedAt}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPlaylist(playlist)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B2544]/60 hover:bg-[#8B5CF6] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem bài</span>
                  </button>
                  <button
                    onClick={(e) => handleDeletePlaylist(playlist.id, playlist.name, e)}
                    className="p-2 text-slate-400 hover:text-[#FE2C55] rounded-lg hover:bg-[#FE2C55]/10 transition-colors cursor-pointer"
                    title="Xóa danh sách phát"
                    aria-label="Xóa danh sách phát"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* B1: Phần 2: Playlist mẫu riêng biệt có nhãn rõ ràng */}
      <div className="space-y-3 pt-4 border-t border-[#1B2544]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#25F4EE]" />
            Playlist gợi ý mẫu (Dữ liệu minh họa)
          </h3>
          <span className="text-xs text-slate-500">Chỉ dùng nghe thử</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {samplePlaylists.map((samplePl) => (
            <div
              key={samplePl.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlaylist(samplePl)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlaylist(samplePl);
                }
              }}
              aria-label={`Xem danh sách phát mẫu ${samplePl.name}`}
              className="p-3.5 rounded-2xl bg-[#0E1528] hover:bg-[#141C33] border border-[#1E294B] hover:border-[#25F4EE]/40 transition-all flex items-center gap-3.5 cursor-pointer group outline-none"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={samplePl.coverUrl}
                  alt={samplePl.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white group-hover:text-[#25F4EE] transition-colors truncate">
                  {samplePl.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Mẫu minh họa • {samplePl.songs.length} bài</p>
              </div>
              <Play className="w-4 h-4 text-slate-400 group-hover:text-[#25F4EE] transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Playlist Details Drawer/Modal */}
      {selectedPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#121829] border border-[#2D3A63] rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B2544]">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={selectedPlaylist.coverUrl}
                    alt={selectedPlaylist.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPlaylist.name}</h3>
                  <p className="text-xs text-slate-400">
                    {playlistSongs.length} bài hát
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!selectedPlaylist.id.startsWith('pl-1') &&
                  !selectedPlaylist.id.startsWith('pl-2') &&
                  !selectedPlaylist.id.startsWith('pl-3') &&
                  !selectedPlaylist.id.startsWith('pl-4') && (
                    <button
                      onClick={(e) => handleDeletePlaylist(selectedPlaylist.id, selectedPlaylist.name, e)}
                      className="p-2 text-slate-400 hover:text-[#FE2C55] rounded-full hover:bg-[#FE2C55]/10 transition-colors"
                      title="Xóa danh sách phát"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#1C2642] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Songs in playlist */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isLoadingSongs ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Đang tải danh sách bài hát...
                </div>
              ) : playlistSongs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Chưa có bài hát nào trong playlist này. Hãy thêm từ danh sách bài hát thịnh hành!
                </div>
              ) : (
                playlistSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePlaySongInPlaylist(song)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlaySongInPlaylist(song);
                        }
                      }}
                      aria-label={`Phát bài ${song.title}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group outline-none ${
                        isCurrent ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/40' : 'hover:bg-[#182138]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <Image src={song.coverUrl} alt={song.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-[#8B5CF6]' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{song.duration}</span>
                        <div className="w-8 h-8 rounded-full bg-[#1B2544] flex items-center justify-center text-slate-300 group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </div>
                        {!selectedPlaylist.id.startsWith('pl-') && (
                          <button
                            onClick={(e) => handleRemoveSong(song.id, e)}
                            className="p-1.5 text-slate-500 hover:text-[#FE2C55] rounded-lg hover:bg-[#FE2C55]/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Xóa bài khỏi playlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={handlePlayAll}
              disabled={playlistSongs.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-sm font-semibold shadow-lg shadow-[#7C3AED]/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
