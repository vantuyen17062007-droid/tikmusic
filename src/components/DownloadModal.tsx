'use client';

import React, { useState } from 'react';
import { X, Download, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { DownloadQuality } from '../types';
import Image from 'next/image';

export default function DownloadModal() {
  const { downloadModalOpen, closeDownloadModal, songToDownload, startDownload } = useMusic();
  const [selectedQuality, setSelectedQuality] = useState<DownloadQuality>('128');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  if (!downloadModalOpen || !songToDownload) return null;

  const qualityOptions: { id: DownloadQuality; label: string; desc: string; size: string }[] = [
    {
      id: '128',
      label: '128 kbps (MP3)',
      desc: 'Tiêu chuẩn',
      size: songToDownload.fileSize128 || '2.5 MB',
    },
    {
      id: '192',
      label: '192 kbps (MP3)',
      desc: 'Chất lượng cao',
      size: songToDownload.fileSize192 || '3.7 MB',
    },
    {
      id: '320',
      label: '320 kbps (MP3)',
      desc: 'Studio Lossless',
      size: songToDownload.fileSize320 || '6.1 MB',
    },
  ];

  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(20);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
            startDownload(songToDownload, selectedQuality);
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#141C33] via-[#11182C] to-[#0D1222] border border-[#2D3A63] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-[#8B5CF6]/20 space-y-6"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-10 w-40 h-40 bg-[#8B5CF6]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-[1.5px]">
              <div className="w-full h-full bg-[#0B0E17] rounded-[6px] flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">TikMusic</h2>
          </div>
          <button
            onClick={closeDownloadModal}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#1C2642] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Info Preview */}
        <div className="flex items-center gap-4 p-3 bg-[#0B0F1C] border border-[#222E52]/80 rounded-2xl">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#161F36]">
            <Image
              src={songToDownload.coverUrl}
              alt={songToDownload.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate text-base">
              {songToDownload.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{songToDownload.artist}</p>
            <p className="text-xs text-[#25F4EE] font-medium mt-1">
              Thời lượng: {songToDownload.duration}
            </p>
          </div>
        </div>

        {/* Quality Options */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200 block">
            Chọn chất lượng tải xuống
          </label>
          <div className="space-y-2.5">
            {qualityOptions.map((opt) => {
              const isSelected = selectedQuality === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedQuality(opt.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#182138] border-[#8B5CF6] ring-1 ring-[#8B5CF6]/50 shadow-md shadow-[#8B5CF6]/10'
                      : 'bg-[#0E1528] border-[#222E52]/60 hover:border-[#8B5CF6]/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#8B5CF6] bg-[#8B5CF6]' : 'border-slate-500'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{opt.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    - {opt.size}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Downloading progress bar */}
        {isDownloading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Đang trích xuất âm thanh từ TikTok...</span>
              <span className="font-semibold text-[#25F4EE]">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-[#1B2544] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#25F4EE] via-[#8B5CF6] to-[#FE2C55] rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white font-bold text-sm sm:text-base shadow-xl shadow-[#7C3AED]/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang tải xuống...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Tải xuống</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
