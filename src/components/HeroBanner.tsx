'use client';

import React, { useState } from 'react';
import { Link2, Download, Music, Sparkles, Play } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export default function HeroBanner() {
  const { openDownloadModal } = useMusic();
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      openDownloadModal();
    }, 600);
  };

  const sampleLinks = [
    'https://www.tiktok.com/@rhyder/video/73918274910283',
    'https://www.tiktok.com/@hieuthuhai/video/72819382019482',
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E1528] via-[#111A35] to-[#1D143D] border border-[#222E52]/80 p-6 sm:p-10 lg:p-12 mb-10 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-12 w-72 h-72 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Text & Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Tải nhạc từ video{' '}
              <span className="bg-gradient-to-r from-[#25F4EE] via-white to-[#FE2C55] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(37,244,238,0.4)]">
                TikTok
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-slate-200">
              Chỉ cần dán link - Nghe ngay!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#25F4EE]" />
              Nhanh chóng
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              Chất lượng cao
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#FE2C55]" />
              Miễn phí
            </span>
          </div>

          {/* Input Box */}
          <form onSubmit={handleDownloadClick} className="space-y-3">
            <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-[#080B14]/90 border border-[#2D3A63] focus-within:border-[#8B5CF6] rounded-2xl shadow-xl transition-all focus-within:ring-2 focus-within:ring-[#8B5CF6]/30">
              <div className="flex items-center gap-3 pl-4 flex-1 w-full py-2 sm:py-0">
                <Link2 className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="Dán link TikTok vào đây..."
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white font-semibold text-sm sm:text-base shadow-lg shadow-[#7C3AED]/40 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Tải nhạc</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Link Pills */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" /> Link mẫu:
              </span>
              <button
                type="button"
                onClick={() => {
                  setTiktokUrl(sampleLinks[0]);
                  handleDownloadClick();
                }}
                className="text-[#25F4EE] hover:underline hover:text-white transition-colors"
              >
                Một đêm say (RHYDER)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setTiktokUrl(sampleLinks[1]);
                  handleDownloadClick();
                }}
                className="text-[#FE2C55] hover:underline hover:text-white transition-colors"
              >
                Em là ai? (HIEUTHUHAI)
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: 3D Smartphone Illustration */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="relative w-64 sm:w-72 h-80 flex items-center justify-center">
            {/* Glowing Neon Rings behind phone */}
            <div className="absolute w-60 h-60 rounded-full border-2 border-[#FE2C55]/30 animate-pulse pointer-events-none" />
            <div className="absolute w-72 h-72 rounded-full border border-[#25F4EE]/20 pointer-events-none" />
            <div className="absolute w-80 h-80 rounded-full border border-[#8B5CF6]/20 pointer-events-none" />

            {/* Floating Music Note 1 */}
            <div className="absolute -top-2 left-6 w-12 h-12 rounded-2xl bg-[#0F172E]/90 border border-[#25F4EE]/60 shadow-lg shadow-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] animate-bounce">
              <Music className="w-6 h-6" />
            </div>

            {/* Floating Play Button */}
            <div className="absolute top-12 -right-4 w-12 h-12 rounded-2xl bg-[#0F172E]/90 border border-[#8B5CF6]/60 shadow-lg shadow-[#8B5CF6]/30 flex items-center justify-center text-[#A855F7]">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>

            {/* Floating Audio Wave Bars */}
            <div className="absolute bottom-4 -right-4 bg-[#0F172E]/90 border border-[#FE2C55]/50 px-3 py-2 rounded-xl flex items-center gap-1 shadow-lg shadow-[#FE2C55]/20">
              <div className="w-1 bg-[#FE2C55] h-5 rounded-full animate-pulse" />
              <div className="w-1 bg-[#25F4EE] h-7 rounded-full animate-pulse delay-75" />
              <div className="w-1 bg-[#8B5CF6] h-3 rounded-full animate-pulse delay-150" />
              <div className="w-1 bg-[#FE2C55] h-6 rounded-full animate-pulse delay-100" />
              <div className="w-1 bg-[#25F4EE] h-4 rounded-full animate-pulse" />
            </div>

            {/* 3D Smartphone Device Mockup */}
            <div className="w-48 sm:w-52 h-72 bg-gradient-to-b from-[#1C2642] to-[#0A0D18] rounded-[36px] p-2.5 border-4 border-[#324068] shadow-2xl shadow-[#8B5CF6]/40 transform -rotate-6 hover:rotate-0 transition-transform duration-500 relative flex flex-col justify-between">
              {/* Speaker / Camera Notch */}
              <div className="w-20 h-4 bg-[#0A0D18] rounded-full mx-auto" />

              {/* Screen Content */}
              <div className="flex-1 my-3 bg-gradient-to-br from-[#121930] via-[#090C15] to-[#1E1136] rounded-[24px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* TikTok Logo Glow */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FE2C55]/20 via-[#25F4EE]/20 to-[#8B5CF6]/20 flex items-center justify-center relative">
                  <svg className="w-12 h-12 text-white drop-shadow-[0_0_12px_rgba(254,44,85,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.209 1.74 2.895 2.895 0 0 1 2.313-4.636c.298 0 .586.046.857.13V9.378a6.34 6.34 0 0 0-.857-.058 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.336-6.34V8.375a8.196 8.196 0 0 0 4.775 1.524V6.454a4.823 4.823 0 0 1-1-.068z" />
                  </svg>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-[11px] font-semibold text-white tracking-wider">TIKTOK SOUND</p>
                  <p className="text-[9px] text-[#25F4EE]">HD Audio 320kbps</p>
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-16 h-1 bg-slate-500/60 rounded-full mx-auto mb-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
