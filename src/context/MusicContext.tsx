'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song, Playlist, DownloadItem, ActiveTab, DownloadQuality } from '../types';
import { MOCK_SONGS, MOCK_PLAYLISTS } from '../data/mockData';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  queue: Song[];
  activeTab: ActiveTab;
  searchQuery: string;
  searchResults: Song[];
  downloadModalOpen: boolean;
  songToDownload: Song | null;
  downloadNotice: string | null;
  downloadHistory: DownloadItem[];
  playlists: Playlist[];
  likedSongIds: string[];

  // Actions
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  handleSearch: (query: string) => void;
  openDownloadModal: (song?: Song, notice?: string) => void;
  closeDownloadModal: () => void;
  startDownload: (song: Song, quality: DownloadQuality) => void;
  createPlaylist: (name: string) => Promise<void>;
  toggleLike: (songId: string) => Promise<void>;
  isLiked: (songId: string) => boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(165);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [queue] = useState<Song[]>(MOCK_SONGS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState<string>('sơn tùng');
  const [searchResults, setSearchResults] = useState<Song[]>(
    MOCK_SONGS.filter((s) => s.artist.toLowerCase().includes('sơn tùng'))
  );

  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [songToDownload, setSongToDownload] = useState<Song | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [likedSongIds, setLikedSongIds] = useState<string[]>(['song-1', 'song-3']);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRepeatRef = useRef<boolean>(false);
  const isShuffleRef = useRef<boolean>(false);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  const playNextRef = useRef<() => void>(() => {});
  playNextRef.current = () => {
    if (!currentSong) return;

    // Chế độ lặp lại bài hát hiện tại
    if (isRepeatRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    if (isShuffleRef.current) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playSong(queue[randomIndex]);
    } else {
      const nextIndex = (currentIndex + 1) % queue.length;
      playSong(queue[nextIndex]);
    }
  };

  // Khởi tạo Audio Element và đồng bộ sự kiện chuẩn HTML5
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audioRef.current = audio;

      const onTimeUpdate = () => setCurrentTime(audio.currentTime);
      const onLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => playNextRef.current();
      const onError = (e: Event) => {
        setIsPlaying(false);
        console.warn('Audio playback error encountered:', e);
      };

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  // Đồng bộ Playlists và Likes với server khi mount
  useEffect(() => {
    async function syncUserData() {
      try {
        const [plRes, likesRes] = await Promise.all([
          fetch('/api/playlists'),
          fetch('/api/likes'),
        ]);

        if (plRes.ok) {
          const plData = await plRes.json();
          if (plData.playlists && plData.playlists.length > 0) {
            interface ServerPlaylist {
              id: string;
              name: string;
              cover_url: string;
              songCount?: number;
            }
            const serverPls: Playlist[] = plData.playlists.map((p: ServerPlaylist) => ({
              id: p.id,
              name: p.name,
              songCount: p.songCount || 0,
              coverUrl: p.cover_url,
              songs: [],
              updatedAt: 'Đã lưu trên tài khoản',
            }));
            setPlaylists((prev) => [
              ...serverPls,
              ...prev.filter((d) => !serverPls.some((u) => u.id === d.id)),
            ]);
          }
        }

        if (likesRes.ok) {
          const likesData = await likesRes.json();
          if (likesData.likedSongIds && Array.isArray(likesData.likedSongIds)) {
            setLikedSongIds(likesData.likedSongIds);
          }
        }
      } catch {
        // Guest mode fallback
      }
    }

    syncUserData();
  }, []);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setDuration(song.durationSec);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          setIsPlaying(false);
          console.warn('Autoplay prevented by browser or media source error:', err);
        });
    }
  };

  const togglePlay = () => {
    if (!currentSong && queue.length > 0) {
      playSong(queue[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current
        ?.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          setIsPlaying(false);
          console.warn('Play was prevented:', err);
        });
    }
  };

  const seek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const setVolumeLevel = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const playNext = () => {
    playNextRef.current();
  };

  const playPrevious = () => {
    if (!currentSong) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playSong(queue[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(MOCK_SONGS);
      setActiveTab('explore');
      return;
    }
    const filtered = MOCK_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setActiveTab('search');
  };

  const openDownloadModal = (song?: Song, notice?: string) => {
    setSongToDownload(song || currentSong || MOCK_SONGS[0]);
    setDownloadNotice(notice || null);
    setDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setDownloadModalOpen(false);
    setDownloadNotice(null);
  };

  const startDownload = (song: Song, quality: DownloadQuality) => {
    const sizeMap: Record<DownloadQuality, string> = {
      '128': song.fileSize128 || '2.5 MB',
      '192': song.fileSize192 || '3.7 MB',
      '320': song.fileSize320 || '6.1 MB',
    };

    const newItem: DownloadItem = {
      id: `dl-${Date.now()}`,
      song,
      quality: `${quality} kbps`,
      fileSize: sizeMap[quality],
      downloadedAt: 'Vừa xong',
      progress: 100,
      status: 'completed',
    };

    setDownloadHistory((prev) => [newItem, ...prev]);
  };

  const createPlaylist = async (name: string) => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.playlist) {
          const newPl: Playlist = {
            id: data.playlist.id,
            name: data.playlist.name,
            songCount: 0,
            coverUrl: data.playlist.cover_url,
            songs: [],
            updatedAt: 'Đã lưu trên tài khoản',
          };
          setPlaylists((prev) => [newPl, ...prev]);
          return;
        }
      }
    } catch {
      // Guest local fallback
    }

    const fallback: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      songCount: 0,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      songs: [],
      updatedAt: 'Tạm thời',
    };
    setPlaylists((prev) => [fallback, ...prev]);
  };

  const toggleLike = async (songId: string) => {
    setLikedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId }),
      });
    } catch {
      // offline/guest fallback
    }
  };

  const isLiked = (songId: string) => likedSongIds.includes(songId);

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        isRepeat,
        queue,
        activeTab,
        searchQuery,
        searchResults,
        downloadModalOpen,
        songToDownload,
        downloadNotice,
        downloadHistory,
        playlists,
        likedSongIds,
        playSong,
        togglePlay,
        seek,
        setVolumeLevel,
        toggleMute,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        setActiveTab,
        handleSearch,
        openDownloadModal,
        closeDownloadModal,
        startDownload,
        createPlaylist,
        toggleLike,
        isLiked,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
