export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string; // e.g. "2:45"
  durationSec: number;
  coverUrl: string;
  audioUrl: string;
  tiktokViews?: string;
  tiktokUser?: string;
  isHot?: boolean;
  category?: string;
  fileSize128?: string;
  fileSize192?: string;
  fileSize320?: string;
  isDemoSample?: boolean;
  isVerifiedAudio?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songCount: number;
  coverUrl: string;
  songs: Song[];
  updatedAt: string;
}

export interface DownloadItem {
  id: string;
  song: Song;
  quality: string;
  fileSize: string;
  downloadedAt: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
}

export type ActiveTab = 'home' | 'explore' | 'playlist' | 'downloads' | 'settings' | 'search' | 'player';

export type DownloadQuality = '128' | '192' | '320';
