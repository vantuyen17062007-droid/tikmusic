import type { Metadata } from 'next';
import './globals.css';
import { MusicProvider } from '../context/MusicContext';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'TikMusic - Tải nhạc từ TikTok - Nghe mọi lúc',
  description: 'Nền tảng tải và thưởng thức nhạc từ TikTok nhanh chóng, miễn phí và chất lượng cao 320kbps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0B0E17] text-slate-100 antialiased min-h-screen selection:bg-[#8B5CF6] selection:text-white">
        <AuthProvider>
          <MusicProvider>{children}</MusicProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
