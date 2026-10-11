'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Vui lòng nhập tên hiển thị';
    } else if (name.trim().length < 2) {
      errors.name = 'Tên hiển thị phải có ít nhất 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMsg('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await register(name.trim(), email.trim(), password, confirmPassword);
      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setGeneralError(res.message);
        if (res.errors) {
          setFieldErrors({
            name: res.errors.name?.[0],
            email: res.errors.email?.[0],
            password: res.errors.password?.[0],
            confirmPassword: res.errors.confirmPassword?.[0],
          });
        }
      }
    } catch {
      setGeneralError('Đã xảy ra sự cố trong quá trình tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#8B5CF6] selection:text-white">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#FE2C55]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>

      {/* Main Register Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#141C33]/90 via-[#10172B]/95 to-[#0B0E18] border border-[#2D3A63] rounded-3xl p-6 sm:p-9 shadow-2xl shadow-[#8B5CF6]/15 relative z-10 backdrop-blur-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FE2C55] via-[#25F4EE] to-[#8B5CF6] p-[2px] shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-[#0B0E17] rounded-[14px] flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">TikMusic</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tạo tài khoản TikMusic
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tạo tài khoản để cá nhân hóa trải nghiệm âm nhạc
          </p>
        </div>

        {/* General Error Alert */}
        {generalError && (
          <div className="p-3.5 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 text-[#FE2C55] text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Tên hiển thị
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="VD: Tuấn Anh, Linh Đan..."
                required
                className={`w-full bg-[#0E1528] border ${
                  fieldErrors.name ? 'border-[#FE2C55]' : 'border-[#263359] focus:border-[#8B5CF6]'
                } text-sm text-white placeholder-slate-500 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30 shadow-inner`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-[#FE2C55] pl-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Địa chỉ Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="tenban@example.com"
                required
                className={`w-full bg-[#0E1528] border ${
                  fieldErrors.email ? 'border-[#FE2C55]' : 'border-[#263359] focus:border-[#8B5CF6]'
                } text-sm text-white placeholder-slate-500 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30 shadow-inner`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-[#FE2C55] pl-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                required
                className={`w-full bg-[#0E1528] border ${
                  fieldErrors.password ? 'border-[#FE2C55]' : 'border-[#263359] focus:border-[#8B5CF6]'
                } text-sm text-white placeholder-slate-500 pl-11 pr-11 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30 shadow-inner`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-[#FE2C55] pl-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Xác nhận mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder="Nhập lại mật khẩu"
                required
                className={`w-full bg-[#0E1528] border ${
                  fieldErrors.confirmPassword
                    ? 'border-[#FE2C55]'
                    : 'border-[#263359] focus:border-[#8B5CF6]'
                } text-sm text-white placeholder-slate-500 pl-11 pr-11 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#8B5CF6]/30 shadow-inner`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-white transition-colors"
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-[#FE2C55] pl-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#C084FC] text-white font-bold text-sm shadow-xl shadow-[#7C3AED]/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pt-3 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              <span>Tạo tài khoản</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[#1C2642]/80">
          <p className="text-xs text-slate-400">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-[#25F4EE] hover:text-white font-semibold transition-colors underline-offset-2 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
