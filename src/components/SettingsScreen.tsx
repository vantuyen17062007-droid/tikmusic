'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HardDrive, Volume2, Info, User, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [defaultQuality, setDefaultQuality] = useState('320');
  const [autoDownload, setAutoDownload] = useState(true);
  const [notifications, setNotifications] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = localStorage.getItem('tikmusic_quality');
      if (q) setDefaultQuality(q);
      const ad = localStorage.getItem('tikmusic_autodownload');
      if (ad !== null) setAutoDownload(ad === 'true');
      const notif = localStorage.getItem('tikmusic_notifications');
      if (notif !== null) setNotifications(notif === 'true');
    }
  }, []);

  const handleQualityChange = (q: string) => {
    setDefaultQuality(q);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tikmusic_quality', q);
    }
  };

  const handleAutoDownloadChange = (val: boolean) => {
    setAutoDownload(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tikmusic_autodownload', String(val));
    }
  };

  const handleNotificationsChange = (val: boolean) => {
    setNotifications(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tikmusic_notifications', String(val));
      if (val && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="pb-4 border-b border-[#1B2544]">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Cài đặt</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tùy chỉnh tài khoản, chất lượng âm thanh và trải nghiệm TikMusic của bạn
        </p>
      </div>

      <div className="space-y-6">
        {/* Section: Account Information */}
        <div className="p-5 rounded-2xl bg-[#121829] border border-[#222E52]/60 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#8B5CF6]" />
            <div>
              <h3 className="text-base font-bold text-white">Tài khoản người dùng</h3>
              <p className="text-xs text-slate-400">Trạng thái đăng nhập và hồ sơ cá nhân</p>
            </div>
          </div>

          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B0F1D] border border-[#1E293B]">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-[#8B5CF6] bg-[#8B5CF6]/20 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {user.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#8B5CF6]/15 text-[#A855F7] font-semibold flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Thành viên
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl bg-[#FE2C55]/10 hover:bg-[#FE2C55]/20 text-[#FE2C55] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#FE2C55]/30 w-full sm:w-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B0F1D] border border-[#1E293B]">
              <div>
                <h4 className="text-sm font-semibold text-white">Bạn đang duyệt ở chế độ Khách</h4>
                <p className="text-xs text-slate-400">Đăng nhập để lưu danh sách yêu thích và lịch sử tải nhạc</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-xs font-bold shadow-md shadow-[#7C3AED]/30 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl bg-[#161F36] text-slate-300 hover:text-white text-xs font-semibold border border-[#263359]"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section: Download Quality */}
        <div className="p-5 rounded-2xl bg-[#121829] border border-[#222E52]/60 space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-[#8B5CF6]" />
            <div>
              <h3 className="text-base font-bold text-white">Chất lượng tải mặc định</h3>
              <p className="text-xs text-slate-400">Tùy chọn mức chất lượng mong muốn khi tải file âm thanh</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { id: '128', label: '128 kbps', desc: 'Tiết kiệm bộ nhớ' },
              { id: '192', label: '192 kbps', desc: 'Chuẩn âm thanh tốt' },
              { id: '320', label: '320 kbps', desc: 'Chất lượng cao nhất' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleQualityChange(item.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  defaultQuality === item.id
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-white'
                    : 'border-[#222E52] bg-[#0E1528] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-[11px] text-slate-400">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section: Tùy chọn ứng dụng */}
        <div className="p-5 rounded-2xl bg-[#121829] border border-[#222E52]/60 space-y-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-[#25F4EE]" />
            <div>
              <h3 className="text-base font-bold text-white">Tải về & Lưu trữ</h3>
              <p className="text-xs text-slate-400">Quản lý cách ứng dụng tải và lưu nhạc</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F1D]">
              <div>
                <p className="text-sm font-semibold text-white">Tự động gắn thẻ ID3 (Tag nhạc)</p>
                <p className="text-xs text-slate-400">Tự động lưu tên ca sĩ, tiêu đề và thông tin bài hát</p>
              </div>
              <input
                type="checkbox"
                checked={autoDownload}
                onChange={(e) => handleAutoDownloadChange(e.target.checked)}
                className="w-5 h-5 accent-[#8B5CF6] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F1D]">
              <div>
                <p className="text-sm font-semibold text-white">Thông báo khi tải xong</p>
                <p className="text-xs text-slate-400">Hiển thị thông báo trình duyệt khi bài hát đã sẵn sàng</p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => handleNotificationsChange(e.target.checked)}
                className="w-5 h-5 accent-[#8B5CF6] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Thông tin ứng dụng */}
        <div className="p-5 rounded-2xl bg-[#121829] border border-[#222E52]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#FE2C55]" />
            <div>
              <h4 className="text-sm font-bold text-white">TikMusic phiên bản 1.0.0</h4>
              <p className="text-xs text-slate-400">Phát triển với Next.js 15, React 19, SQLite & Tailwind CSS</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-[#8B5CF6]/20 text-[#A855F7] rounded-full">
            Bản mới nhất
          </span>
        </div>
      </div>
    </div>
  );
}
