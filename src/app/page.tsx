'use client';

import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { MOCK_SONGS } from '../data/mockData';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import TrendingMusic from '../components/TrendingMusic';
import SearchResults from '../components/SearchResults';
import NowPlayingScreen from '../components/NowPlayingScreen';
import PlaylistScreen from '../components/PlaylistScreen';
import DownloadsScreen from '../components/DownloadsScreen';
import SettingsScreen from '../components/SettingsScreen';
import ExploreScreen from '../components/ExploreScreen';
import BottomPlayerBar from '../components/BottomPlayerBar';
import DownloadModal from '../components/DownloadModal';
import MobileNavBar from '../components/MobileNavBar';
import { LayoutGrid, Download, Music } from 'lucide-react';
import { ActiveTab } from '../types';

export default function Home() {
  const { activeTab, setActiveTab, openDownloadModal } = useMusic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0E17] text-white">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-[#0B0E17] border-r border-[#1B2544] p-5 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-[2px]">
                  <div className="w-full h-full bg-[#0B0E17] rounded-[10px] flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">TikMusic</h1>
                  <p className="text-[11px] text-slate-400">Tải nhạc từ TikTok</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                {[
                  { id: 'home' as ActiveTab, label: 'Trang chủ' },
                  { id: 'explore' as ActiveTab, label: 'Khám phá' },
                  { id: 'playlist' as ActiveTab, label: 'Playlist của tôi' },
                  { id: 'downloads' as ActiveTab, label: 'Tải xuống' },
                  { id: 'settings' as ActiveTab, label: 'Cài đặt' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-[#161F36]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-28 md:pb-24">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* View Switcher Bar (Quick view preview matching the 5 mockups in user prompt) */}
        <div className="px-4 sm:px-8 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <LayoutGrid className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Màn hình mẫu:
            </span>
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                activeTab === 'home'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                  : 'bg-[#121829] hover:bg-[#1C2642] text-slate-300'
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                activeTab === 'search'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                  : 'bg-[#121829] hover:bg-[#1C2642] text-slate-300'
              }`}
            >
              Kết quả tìm kiếm
            </button>
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                activeTab === 'player'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                  : 'bg-[#121829] hover:bg-[#1C2642] text-slate-300'
              }`}
            >
              Trang phát nhạc
            </button>
            <button
              onClick={() => openDownloadModal()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 bg-[#121829] hover:bg-[#1C2642] text-slate-300 transition-all flex items-center gap-1 text-[#25F4EE]"
            >
              <Download className="w-3 h-3" />
              Tải nhạc từ video TikTok (Modal)
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                activeTab === 'playlist'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                  : 'bg-[#121829] hover:bg-[#1C2642] text-slate-300'
              }`}
            >
              Playlist của tôi
            </button>
          </div>
        </div>

        {/* Dynamic Screen Container */}
        <main className="flex-1 px-4 sm:px-8 py-4 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <div className="space-y-10 animate-in fade-in duration-200">
              <HeroBanner />
              <TrendingMusic songs={MOCK_SONGS} />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="animate-in fade-in duration-200">
              <SearchResults />
            </div>
          )}

          {activeTab === 'player' && (
            <div className="animate-in fade-in duration-200">
              <NowPlayingScreen />
            </div>
          )}

          {activeTab === 'playlist' && (
            <div className="animate-in fade-in duration-200">
              <PlaylistScreen />
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="animate-in fade-in duration-200">
              <ExploreScreen />
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="animate-in fade-in duration-200">
              <DownloadsScreen />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-200">
              <SettingsScreen />
            </div>
          )}
        </main>
      </div>

      {/* Persistent Bottom Player */}
      <BottomPlayerBar />

      {/* Download Quality Modal */}
      <DownloadModal />

      {/* Mobile Bottom Navigation */}
      <MobileNavBar />
    </div>
  );
}
