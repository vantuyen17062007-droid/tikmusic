'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Song, Playlist, DownloadItem, ActiveTab, DownloadQuality } from '../types';
import { MOCK_SONGS, MOCK_PLAYLISTS } from '../data/mockData';

export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

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
  samplePlaylists: Playlist[];
  likedSongIds: string[];
  toastMessage: string | null;
  playlistModalOpen: boolean;
  songForPlaylist: Song | null;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
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
  filterByCategory: (categoryName: string) => void;
  openDownloadModal: (song?: Song, notice?: string) => void;
  closeDownloadModal: () => void;
  startDownload: (song: Song, quality: DownloadQuality) => void;
  triggerDirectDownload: (song: Song) => Promise<boolean>;
  createPlaylist: (name: string) => Promise<boolean>;
  deletePlaylist: (playlistId: string) => Promise<boolean>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<{ success: boolean; message: string }>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<{ success: boolean; message: string }>;
  openAddToPlaylistModal: (song: Song) => void;
  closeAddToPlaylistModal: () => void;
  toggleLike: (songId: string) => Promise<void>;
  isLiked: (songId: string) => boolean;
  showToast: (message: string) => void;
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
  const [queue, setQueue] = useState<Song[]>(MOCK_SONGS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  // D8: Mặc định không tìm kiếm từ khóa giả lập
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [songToDownload, setSongToDownload] = useState<Song | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);

  // B1: Playlists của user khởi tạo rỗng, không trộn lẫn mock data
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const samplePlaylists = MOCK_PLAYLISTS;

  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playlistModalOpen, setPlaylistModalOpen] = useState<boolean>(false);
  const [songForPlaylist, setSongForPlaylist] = useState<Song | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRepeatRef = useRef<boolean>(false);
  const isShuffleRef = useRef<boolean>(false);
  const queueRef = useRef<Song[]>(MOCK_SONGS);
  const currentSongRef = useRef<Song | null>(MOCK_SONGS[0]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    setCurrentSong(song);
    currentSongRef.current = song;
    setDuration(song.durationSec || 180);
    setCurrentTime(0);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      queueRef.current = newQueue;
    }

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
          console.warn('Autoplay prevented or audio source error:', err);
          if (!song.audioUrl) {
            showToast('Không phát được bài này. Không có nguồn âm thanh hợp lệ.');
          }
        });
    }
  }, [showToast]);

  // F3: Gom logic playNext về 1 hàm duy nhất
  const playNext = useCallback(() => {
    const cur = currentSongRef.current;
    const curQueue = queueRef.current;
    if (!cur || curQueue.length === 0) return;

    // Chế độ lặp lại bài hát hiện tại
    if (isRepeatRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          setIsPlaying(false);
          console.warn('Repeat play error:', err);
          showToast('Không thể phát lại bài hát.');
        });
      }
      return;
    }

    // D6: Chế độ ngẫu nhiên - tránh chọn lại bài đang phát nếu hàng đợi > 1 bài
    if (isShuffleRef.current && curQueue.length > 1) {
      const candidates = curQueue.filter((s) => s.id !== cur.id);
      const randomIndex = Math.floor(Math.random() * candidates.length);
      playSong(candidates[randomIndex]);
      return;
    }

    const currentIndex = curQueue.findIndex((s) => s.id === cur.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % curQueue.length;
    playSong(curQueue[nextIndex]);
  }, [playSong, showToast]);

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
      const onEnded = () => playNext();
      const onError = () => {
        setIsPlaying(false);
        showToast('Không phát được bài này. Nguồn âm thanh có thể đang bị lỗi.');
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
  }, [playNext, showToast]);

  // B1/B4: Đồng bộ Playlists, Likes và Downloads với server khi mount
  useEffect(() => {
    async function syncUserData() {
      try {
        const [plRes, likesRes, dlRes] = await Promise.all([
          fetch('/api/playlists'),
          fetch('/api/likes'),
          fetch('/api/downloads'),
        ]);

        if (plRes.ok) {
          const plData = await plRes.json();
          if (plData.playlists && Array.isArray(plData.playlists)) {
            interface ServerPlaylist {
              id: string;
              name: string;
              cover_url: string;
              songCount?: number;
              created_at: string;
            }
            const serverPls: Playlist[] = plData.playlists.map((p: ServerPlaylist) => ({
              id: p.id,
              name: p.name,
              songCount: p.songCount || 0,
              coverUrl: p.cover_url,
              songs: [],
              updatedAt: new Date(p.created_at).toLocaleDateString('vi-VN'),
            }));
            setPlaylists(serverPls);
          }
        }

        if (likesRes.ok) {
          const likesData = await likesRes.json();
          if (likesData.likedSongIds && Array.isArray(likesData.likedSongIds)) {
            setLikedSongIds(likesData.likedSongIds);
          }
        }

        if (dlRes.ok) {
          const dlData = await dlRes.json();
          if (dlData.downloads && Array.isArray(dlData.downloads) && dlData.downloads.length > 0) {
            interface ServerDownload {
              id: string;
              song_id: string;
              song_title: string;
              quality: string;
              created_at: string;
            }
            const history: DownloadItem[] = dlData.downloads.map((d: ServerDownload) => {
              const matchedSong = MOCK_SONGS.find((s) => s.id === d.song_id) || {
                id: d.song_id,
                title: d.song_title,
                artist: 'TikTok Audio',
                duration: '3:00',
                durationSec: 180,
                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
                audioUrl: '',
              };
              return {
                id: d.id,
                song: matchedSong,
                quality: d.quality,
                fileSize: '3.5 MB',
                downloadedAt: new Date(d.created_at).toLocaleDateString('vi-VN'),
                progress: 100,
                status: 'completed' as const,
              };
            });
            setDownloadHistory(history);
          }
        }
      } catch {
        // Guest mode fallback
      }
    }

    syncUserData();
  }, []);

  // C1: Khi chưa có src, gọi playSong(currentSong) trước thay vì thất bại âm thầm
  const togglePlay = () => {
    if (!audioRef.current?.src || audioRef.current.src === '' || audioRef.current.src === window.location.href) {
      if (currentSong) {
        playSong(currentSong);
        return;
      }
      if (queue.length > 0) {
        playSong(queue[0]);
        return;
      }
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
          showToast('Không phát được bài này.');
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

  const playPrevious = () => {
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playSong(queue[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

  // F7: Chuẩn hóa tiếng Việt khi tìm kiếm (NFC & bỏ dấu)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setActiveTab('search');
      return;
    }
    const cleanQuery = removeDiacritics(query.trim());
    const filtered = MOCK_SONGS.filter((s) => {
      const matchTitle = removeDiacritics(s.title).includes(cleanQuery);
      const matchArtist = removeDiacritics(s.artist).includes(cleanQuery);
      const matchCat = s.category ? removeDiacritics(s.category).includes(cleanQuery) : false;
      return matchTitle || matchArtist || matchCat;
    });
    setSearchResults(filtered);
    setActiveTab('search');
  };

  // D2: Lọc theo danh mục/thể loại từ màn hình Khám phá
  const filterByCategory = (categoryName: string) => {
    setSearchQuery(categoryName);
    const cleanTarget = removeDiacritics(categoryName.trim().toLowerCase());
    const filtered = MOCK_SONGS.filter((s) => {
      const cat = removeDiacritics((s.category || '').toLowerCase());
      const title = removeDiacritics(s.title.toLowerCase());
      const artist = removeDiacritics(s.artist.toLowerCase());

      if (cleanTarget.includes('tiktok') || cleanTarget.includes('trend')) {
        return Boolean(s.isHot || s.tiktokViews);
      }
      if (cleanTarget.includes('v-pop') || cleanTarget.includes('vpop')) {
        return cat.includes('v-pop') || cat.includes('vpop');
      }
      if (cleanTarget.includes('rap')) {
        return cat.includes('rap');
      }
      if (cleanTarget.includes('acoustic') || cleanTarget.includes('chill')) {
        return cat.includes('acoustic') || cat.includes('chill') || cat.includes('ballad');
      }
      if (cleanTarget.includes('remix') || cleanTarget.includes('vinahouse')) {
        return cat.includes('remix') || cat.includes('vinahouse') || title.includes('remix');
      }
      if (cleanTarget.includes('us-uk') || cleanTarget.includes('viral')) {
        return cat.includes('us-uk') || cat.includes('viral') || artist.includes('jvke');
      }
      return (
        cat.includes(cleanTarget) ||
        cleanTarget.includes(cat) ||
        title.includes(cleanTarget) ||
        artist.includes(cleanTarget)
      );
    });
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

  // B4: Lưu lịch sử tải vào DB khi tải
  const startDownload = useCallback((song: Song, quality: DownloadQuality) => {
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

    // Lưu vào database nếu người dùng đã đăng nhập
    fetch('/api/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: song.id,
        songTitle: song.title,
        quality: `${quality} kbps`,
      }),
    }).catch(() => {});
  }, []);

  // Việc 1: Tải trực tiếp bài hát khi autoDownload được bật
  const triggerDirectDownload = useCallback(
    async (song: Song): Promise<boolean> => {
      if (!song.audioUrl) {
        showToast('Bài hát này chưa có nguồn âm thanh hợp lệ.');
        return false;
      }

      try {
        let quality: DownloadQuality = '320';
        try {
          const saved = localStorage.getItem('tikmusic_quality');
          if (saved && ['128', '192', '320'].includes(saved)) {
            quality = saved as DownloadQuality;
          }
        } catch {}

        let extension = 'mp3';
        if (song.audioUrl.endsWith('.ogg')) extension = 'ogg';
        else if (song.audioUrl.endsWith('.wav')) extension = 'wav';

        const fileName = `${song.artist} - ${song.title}.${extension}`;
        const proxyUrl = `/api/audio/proxy?url=${encodeURIComponent(song.audioUrl)}&filename=${encodeURIComponent(fileName)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) {
          let errText = 'Nguồn âm thanh không phản hồi hoặc bị hạn chế bản quyền.';
          try {
            const errJson = await response.json();
            if (errJson.message) errText = errJson.message;
          } catch {}
          showToast(errText);
          return false;
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        startDownload(song, quality);

        try {
          const notifEnabled = localStorage.getItem('tikmusic_notifications') === 'true';
          if (
            notifEnabled &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('TikMusic - Tải nhạc hoàn tất', {
              body: `Đã tải xong bài hát: ${song.artist} - ${song.title}`,
              icon: song.coverUrl,
            });
          }
        } catch {}

        showToast(`Đã tải xong: ${song.title}`);
        return true;
      } catch {
        showToast('Lỗi mạng khi tải bài hát.');
        return false;
      }
    },
    [showToast, startDownload]
  );

  // B2: Tạo playlist có đồng bộ server và thông báo
  const createPlaylist = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.status === 401) {
        showToast('Vui lòng đăng nhập để tạo và lưu playlist.');
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.playlist) {
          const newPl: Playlist = {
            id: data.playlist.id,
            name: data.playlist.name,
            songCount: 0,
            coverUrl: data.playlist.cover_url,
            songs: [],
            updatedAt: 'Vừa tạo',
          };
          setPlaylists((prev) => [newPl, ...prev]);
          showToast('Tạo playlist thành công!');
          return true;
        }
      }
    } catch {
      showToast('Lỗi mạng khi tạo playlist.');
    }
    return false;
  };

  // B2: Xóa playlist
  const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      if (res.status === 401) {
        showToast('Vui lòng đăng nhập để xóa playlist.');
        return false;
      }

      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        showToast('Đã xóa playlist thành công!');
        return true;
      } else {
        const data = await res.json();
        showToast(data.message || 'Không thể xóa playlist.');
        return false;
      }
    } catch {
      showToast('Lỗi mạng khi xóa playlist.');
      return false;
    }
  };

  // B2: Thêm bài hát vào playlist
  const addSongToPlaylist = async (
    playlistId: string,
    song: Song
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          cover_url: song.coverUrl,
          audio_url: song.audioUrl,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        showToast('Vui lòng đăng nhập để thêm bài vào playlist.');
        return { success: false, message: 'Vui lòng đăng nhập' };
      }

      if (res.ok && data.success) {
        setPlaylists((prev) =>
          prev.map((pl) => {
            if (pl.id === playlistId) {
              const updatedSongs = [song, ...pl.songs.filter((s) => s.id !== song.id)];
              return {
                ...pl,
                songs: updatedSongs,
                songCount: updatedSongs.length,
              };
            }
            return pl;
          })
        );
        showToast(data.message || 'Đã thêm bài hát vào danh sách phát!');
        return { success: true, message: data.message };
      } else {
        showToast(data.message || 'Không thể thêm bài hát.');
        return { success: false, message: data.message || 'Lỗi thêm bài' };
      }
    } catch {
      showToast('Lỗi kết nối khi thêm bài hát.');
      return { success: false, message: 'Lỗi mạng' };
    }
  };

  // B2: Xóa bài hát khỏi playlist
  const removeSongFromPlaylist = async (
    playlistId: string,
    songId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs?songId=${encodeURIComponent(songId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.status === 401) {
        showToast('Vui lòng đăng nhập để xóa bài khỏi playlist.');
        return { success: false, message: 'Vui lòng đăng nhập' };
      }

      if (res.ok && data.success) {
        setPlaylists((prev) =>
          prev.map((pl) => {
            if (pl.id === playlistId) {
              const updatedSongs = pl.songs.filter((s) => s.id !== songId);
              return {
                ...pl,
                songs: updatedSongs,
                songCount: updatedSongs.length,
              };
            }
            return pl;
          })
        );
        showToast(data.message || 'Đã xóa bài hát khỏi danh sách phát.');
        return { success: true, message: data.message };
      } else {
        showToast(data.message || 'Không thể xóa bài hát.');
        return { success: false, message: data.message };
      }
    } catch {
      showToast('Lỗi kết nối khi xóa bài hát.');
      return { success: false, message: 'Lỗi mạng' };
    }
  };

  const openAddToPlaylistModal = (song: Song) => {
    setSongForPlaylist(song);
    setPlaylistModalOpen(true);
  };

  const closeAddToPlaylistModal = () => {
    setPlaylistModalOpen(false);
    setSongForPlaylist(null);
  };

  // B3: Yêu thích có phản hồi, hoàn tác khi 401 hoặc lỗi mạng
  const toggleLike = async (songId: string) => {
    const previouslyLiked = likedSongIds.includes(songId);

    // Cập nhật tạm thời giao diện
    setLikedSongIds((prev) =>
      previouslyLiked ? prev.filter((id) => id !== songId) : [...prev, songId]
    );

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId }),
      });

      if (res.status === 401) {
        // Hoàn tác lại trạng thái và báo thông báo
        setLikedSongIds((prev) =>
          previouslyLiked ? [...prev, songId] : prev.filter((id) => id !== songId)
        );
        showToast('Đăng nhập để lưu bài hát yêu thích.');
        return;
      }

      if (!res.ok) {
        setLikedSongIds((prev) =>
          previouslyLiked ? [...prev, songId] : prev.filter((id) => id !== songId)
        );
        showToast('Đã xảy ra lỗi khi lưu bài hát yêu thích.');
        return;
      }

      const data = await res.json();
      showToast(data.message || (previouslyLiked ? 'Đã bỏ khỏi mục yêu thích.' : 'Đã thêm vào mục yêu thích!'));
    } catch {
      setLikedSongIds((prev) =>
        previouslyLiked ? [...prev, songId] : prev.filter((id) => id !== songId)
      );
      showToast('Lỗi mạng: Không thể lưu bài hát yêu thích.');
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
        samplePlaylists,
        likedSongIds,
        toastMessage,
        playlistModalOpen,
        songForPlaylist,
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
        filterByCategory,
        openDownloadModal,
        closeDownloadModal,
        startDownload,
        triggerDirectDownload,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        openAddToPlaylistModal,
        closeAddToPlaylistModal,
        toggleLike,
        isLiked,
        showToast,
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
