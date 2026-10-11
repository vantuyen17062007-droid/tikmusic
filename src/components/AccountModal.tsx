'use client';

import React, { useState } from 'react';
import { X, User, Mail, Calendar, Shield, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setMsg({ type: 'error', text: 'Tên hiển thị phải có ít nhất 2 ký tự' });
      return;
    }

    setIsSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: 'Cập nhật tên hiển thị thành công!' });
        await refreshUser();
        setIsEditing(false);
      } else {
        setMsg({ type: 'error', text: data.message || 'Lỗi khi cập nhật' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Gần đây';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#141C33] via-[#10172B] to-[#0A0D18] border border-[#2D3A63] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1B2544]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#8B5CF6]" />
            Tài khoản của tôi
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#1C2642] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0E1528] border border-[#222E52]/80">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2 ring-[#8B5CF6]/50 bg-[#161F36] flex items-center justify-center">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="text-xl font-black text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-white text-lg truncate">{user.name}</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25F4EE] bg-[#25F4EE]/10 px-2 py-0.5 rounded-md mt-1.5">
              <Shield className="w-3 h-3" />
              Tài khoản đã xác thực
            </span>
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div
            className={`p-3 rounded-xl text-xs sm:text-sm ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#FE2C55]/10 border border-[#FE2C55]/30 text-[#FE2C55]'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tên hiển thị mới</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full bg-[#0B0E17] border border-[#2D3A63] focus:border-[#8B5CF6] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user.name);
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-[#161F36]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/30"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1528]/60 border border-[#1E293B]">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                Email
              </span>
              <span className="font-semibold text-white">{user.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1528]/60 border border-[#1E293B]">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tham gia từ
              </span>
              <span className="font-semibold text-white">{formattedDate}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2.5 rounded-xl bg-[#1B2544] hover:bg-[#253359] text-white text-xs sm:text-sm font-semibold transition-all border border-[#2D3A63]"
          >
            Đổi tên hiển thị
          </button>
        )}
      </div>
    </div>
  );
}
