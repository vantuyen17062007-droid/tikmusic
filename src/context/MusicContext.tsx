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
  openDownloadModal: (song?: Song) => void;
  closeDownloadModal: () => void;
  startDownload: (song: Song, quality: DownloadQuality) => void;
  createPlaylist: (name: string) => void;
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]); // default to "Một đêm say"
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(92); // 1:32 default from mockup
  const [duration, setDuration] = useState<number>(165); // 2:45
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
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [likedSongIds, setLikedSongIds] = useState<string[]>(['song-1', 'song-3']);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNextRef = useRef<() => void>(() => {});
  playNextRef.current = () => {
    if (!currentSong) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playSong(queue[randomIndex]);
    } else {
      const nextIndex = (currentIndex + 1) % queue.length;
      playSong(queue[nextIndex]);
    }
  };

  // Initialize Audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      const audio = audioRef.current;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      });

      audio.addEventListener('ended', () => {
        playNextRef.current();
      });

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setDuration(song.durationSec);
    setCurrentTime(0);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.play().catch(() => {
        // Autoplay restrictions or demo audio fallback
        console.log('Playback started');
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
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const setVolumeLevel = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const playNext = () => {
    if (!currentSong) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playSong(queue[randomIndex]);
    } else {
      const nextIndex = (currentIndex + 1) % queue.length;
      playSong(queue[nextIndex]);
    }
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

  const openDownloadModal = (song?: Song) => {
    setSongToDownload(song || currentSong || MOCK_SONGS[0]);
    setDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setDownloadModalOpen(false);
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

    // Create realistic virtual download
    const element = document.createElement('a');
    element.setAttribute('href', song.audioUrl);
    element.setAttribute('download', `${song.artist} - ${song.title} (${quality}kbps).mp3`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    closeDownloadModal();
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      songCount: 0,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      songs: [],
      updatedAt: 'Vừa tạo',
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  const toggleLike = (songId: string) => {
    setLikedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
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
