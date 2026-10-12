'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronDown,
  Music,
  Menu,
  LogIn,
  User as UserIcon,
  LogOut,
  ListMusic,
  DownloadCloud,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import AccountModal from './AccountModal';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { searchQuery, handleSearch, openDownloadModal, triggerDirectDownload, setActiveTab, showToast } = useMusic();
  const { user, logout, isLoading } = useAuth();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isSearchingLink, setIsSearchingLink] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (inputVal.includes('tiktok.com') || inputVal.includes('vt.tiktok.com')) {
      setIsSearchingLink(true);
      try {
        const res = await fetch('/api/tiktok/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputVal.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          let isAuto = false;
          try {
            isAuto = typeof window !== 'undefined' && localStorage.getItem('tikmusic_autodownload') === 'true';
          } catch {}

          if (isAuto && data.data && data.data.audioUrl) {
            await triggerDirectDownload(data.data);
            setMobileSearchOpen(false);
          } else {
            openDownloadModal(data.data, data.message);
            setMobileSearchOpen(false);
          }
        } else {
          showToast(data.message || 'Không thể xử lý link TikTok này.');
        }
      } catch {
        showToast('Lỗi kết nối máy chủ.');
      } finally {
        setIsSearchingLink(false);
      }
    } else {
      handleSearch(inputVal);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="border-b border-[#1B2544]/60 bg-[#0B0E17]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="h-20 px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile brand & menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-[#161F36]"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-[2px]">
                <div className="w-full h-full bg-[#0B0E17] rounded-[6px] flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-bold text-white text-base">TikMusic</span>
            </div>
          </div>

          {/* Center Search Bar (Desktop / Tablet) */}
          <form
            onSubmit={onSubmit}
            className="flex-1 max-w-2xl hidden sm:flex items-center relative"
          >
            <div className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Dán link TikTok hoặc tìm kiếm bài hát..."
                className="w-full bg-[#121829] border border-[#222E52] focus:border-[#8B5CF6] text-sm text-white placeholder-slate-400 pl-11 pr-28 py-2.5 rounded-full outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearchingLink}
                className="absolute right-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white text-xs font-semibold shadow-md shadow-[#7C3AED]/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSearchingLink ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>
          </form>

          {/* Right User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* D1: Mobile Search Toggle Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 sm:hidden rounded-full text-slate-300 hover:text-white hover:bg-[#161F36] transition-all cursor-pointer"
              title="Tìm kiếm"
              aria-label="Tìm kiếm bài hát hoặc dán link TikTok"
            >
              <Search className="w-5 h-5" />
            </button>

          {/* User Auth Section */}
          {isLoading ? (
            <div className="w-24 h-9 bg-[#121829] rounded-full animate-pulse" />
          ) : user ? (
            /* Logged in User Profile Pill & Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 bg-[#121829] hover:bg-[#1A233D] border border-[#222E52] px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden relative ring-1 ring-[#8B5CF6] bg-[#8B5CF6]/20 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate hidden sm:inline-block">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#121829] border border-[#2D3A63] shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-[#1B2544]">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setAccountModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#1A233D] flex items-center gap-2.5 transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Tài khoản của tôi</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setActiveTab('playlist');
                      }}
                      className="w-full px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#1A233D] flex items-center gap-2.5 transition-colors text-left"
                    >
                      <ListMusic className="w-4 h-4 text-[#25F4EE]" />
                      <span>Playlist của tôi</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setActiveTab('downloads');
                      }}
                      className="w-full px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#1A233D] flex items-center gap-2.5 transition-colors text-left"
                    >
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Bài hát đã tải</span>
                    </button>
                  </div>

                  <div className="border-t border-[#1B2544] pt-1">
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        const res = await logout();
                        showToast(res.message || 'Đã đăng xuất tài khoản.');
                      }}
                      className="w-full px-4 py-2 text-xs sm:text-sm text-[#FE2C55] hover:bg-[#FE2C55]/10 flex items-center gap-2.5 transition-colors text-left font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated User: Login / Register Buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A855F7] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#7C3AED]/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex px-3.5 py-2 rounded-full bg-[#121829] hover:bg-[#1C2642] border border-[#222E52] text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

        {/* D1: Mobile Search Bar Expansion */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-4 py-2.5 bg-[#0D1222] border-t border-[#1B2544]/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <form onSubmit={onSubmit} className="flex-1 flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Dán link TikTok hoặc tìm bài hát..."
                className="w-full bg-[#121829] border border-[#222E52] focus:border-[#8B5CF6] text-xs text-white placeholder-slate-400 pl-9 pr-20 py-2 rounded-full outline-none focus:ring-1 focus:ring-[#8B5CF6]/50"
              />
              <button
                type="submit"
                disabled={isSearchingLink}
                className="absolute right-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-[11px] font-semibold active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSearchingLink ? '...' : 'Tìm'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Đóng tìm kiếm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Account Info Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
}
