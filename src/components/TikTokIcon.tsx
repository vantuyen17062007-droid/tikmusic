import React from 'react';

interface TikTokIconProps {
  className?: string;
}

export default function TikTokIcon({ className = 'w-4 h-4' }: TikTokIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.209 1.74 2.895 2.895 0 0 1 2.313-4.636c.298 0 .586.046.857.13V9.378a6.34 6.34 0 0 0-.857-.058 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.336-6.34V8.375a8.196 8.196 0 0 0 4.775 1.524V6.454a4.823 4.823 0 0 1-1-.068z" />
    </svg>
  );
}
