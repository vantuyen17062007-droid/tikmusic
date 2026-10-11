# TikMusic 🎵

> Nền tảng nghe nhạc trực tuyến, quản lý danh sách phát và khám phá âm nhạc thịnh hành từ TikTok với giao diện Dark Neon Music hiện đại.

---

## 📌 1. Giới thiệu dự án

TikMusic là ứng dụng web full-stack được xây dựng trên nền tảng **Next.js 15 (App Router)**, **React 19**, **TypeScript** và **Tailwind CSS v4**. Ứng dụng cung cấp:
- Trình phát nhạc chuẩn HTML5 Audio với đầy đủ tính năng: phát/tạm dừng, tua thời gian, điều chỉnh âm lượng, phát ngẫu nhiên (Shuffle), lặp lại (Repeat).
- Hệ thống tài khoản người dùng an toàn: Đăng ký, Đăng nhập, Duy trì phiên bằng HTTP-only cookie, Đăng xuất, Cập nhật hồ sơ.
- Quản lý dữ liệu người dùng: Danh sách phát cá nhân (Playlists), Thêm/Xóa bài hát trong playlist, Bài hát yêu thích (Likes), Lịch sử tải nhạc (Download history).
- Công cụ tìm kiếm bài hát thông minh: Hỗ trợ tìm kiếm không dấu/có dấu (chuẩn hóa Unicode tiếng Việt NFC), lọc theo chủ đề và thể loại âm nhạc.
- Trải nghiệm giao diện **Dark Neon Music**: Tông màu đen, tím neon (`#8B5CF6`), xanh cyan (`#25F4EE`) và hồng TikTok (`#FE2C55`), responsive hoàn hảo trên mọi kích thước màn hình từ Desktop đến Mobile (375px+).

---

## ⚙️ 2. Công nghệ sử dụng

- **Frontend Framework**: Next.js 15.2.1, React 19, Tailwind CSS v4.
- **Backend / API**: Next.js App Router API Routes.
- **Cơ sở dữ liệu**: Turso Database (LibSQL) cho production; tự động dùng SQLite cục bộ (`./data/tikmusic.db`) khi chạy môi trường development.
- **Bảo mật & Xác thực**: `jose` (JWT ES256/HS256 an toàn), `bcryptjs` (băm mật khẩu salt rounds 12), `crypto` (băm SHA-256 lưu token phiên), Rate Limiting theo IP trong DB, phòng chống CSRF (kiểm tra Origin/Host), chống SSRF trong API proxy âm thanh.
- **Validation**: `zod`.
- **Icons**: `lucide-react` và custom `TikTokIcon` SVG.

---

## 🔐 3. Biến môi trường (Environment Variables)

Sao chép file `.env.example` thành `.env.local` trước khi khởi chạy:

```bash
cp .env.example .env.local
```

### Danh sách biến bắt buộc:

| Biến môi trường | Bắt buộc | Mô tả | Ví dụ / Yêu cầu |
| :--- | :---: | :--- | :--- |
| `JWT_SECRET` | **Có** | Khóa bí mật dùng để ký và xác thực token JWT. | Chuỗi ký tự ngẫu nhiên, **tối thiểu 32 ký tự**. Tuyệt đối không dùng chuỗi mặc định trên production. |
| `TURSO_DATABASE_URL` | **Production** | Đường dẫn kết nối database LibSQL trên Turso Cloud. | `libsql://tikmusic-db-yourname.turso.io` |
| `TURSO_AUTH_TOKEN` | **Production** | Token xác thực truy cập cơ sở dữ liệu Turso. | `eyJhbGciOi...` |
| `NODE_ENV` | Không | Môi trường ứng dụng (`development` hoặc `production`). | `development` |

> ⚠️ **Lưu ý quan trọng:**
> - Trong môi trường **Development**, nếu không cấu hình Turso, hệ thống sẽ tự động khởi tạo và lưu trữ dữ liệu vào file SQLite tại `./data/tikmusic.db`.
> - Trong môi trường **Production**, nếu thiếu `TURSO_DATABASE_URL` hoặc `TURSO_AUTH_TOKEN`, hệ thống sẽ ném lỗi rõ ràng và từ chối chạy để tránh mất dữ liệu trên nền tảng Serverless (như Vercel).

---

## 🚀 4. Cài đặt và Hướng dẫn chạy

### Yêu cầu tiên quyết:
- **Node.js**: Phiên bản 18.18+ hoặc 20+ (Khuyên dùng Node 20 LTS trở lên).
- **npm** hoặc **yarn** / **pnpm**.

### Bước 1: Cài đặt dependencies
```bash
npm ci
# hoặc: npm install
```

### Bước 2: Tạo file `.env.local`
Tạo file `.env.local` ở thư mục gốc:
```env
JWT_SECRET=c29tZV9zdXBlcl9zZWNyZXRfa2V5XzMyX2NoYXJzX2xvbmdfMTIzNDU2Nzg5MA==
```

### Bước 3: Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt.

### Bước 4: Kiểm tra chất lượng mã nguồn & Build Production
```bash
# Kiểm tra TypeScript
npx tsc --noEmit

# Kiểm tra ESLint
npx eslint src

# Chạy toàn bộ bộ test tự động
node --test tests/**/*.test.mjs

# Build ứng dụng cho môi trường Production
npm run build
```

---

## 📂 5. Cấu trúc thư mục chính

```text
tikmusic/
├── data/                      # Lưu trữ file SQLite cục bộ (khi chạy dev)
├── src/
│   ├── app/                   # App Router (Next.js 15)
│   │   ├── api/               # API Routes (auth, playlists, likes, downloads, audio proxy, tiktok)
│   │   ├── login/             # Trang Đăng nhập
│   │   ├── register/          # Trang Đăng ký
│   │   ├── layout.tsx         # Root Layout, font, providers
│   │   └── page.tsx           # Trang chủ & điều hướng các tab
│   ├── components/            # UI Components (Header, Sidebar, Player, Modal, v.v.)
│   ├── context/               # React Contexts (AuthContext, MusicContext)
│   ├── data/                  # Dữ liệu minh họa (mockData.ts)
│   ├── lib/                   # Thư viện dùng chung (db.ts, auth.ts, utils.ts)
│   └── types/                 # Định nghĩa kiểu dữ liệu TypeScript
├── tests/                     # Bộ kiểm thử tự động (node --test)
│   ├── auth.test.mjs          # Kiểm thử xác thực & phiên làm việc
│   ├── group-a.test.mjs       # Kiểm thử bảo mật (Nhóm A)
│   └── group-b.test.mjs       # Kiểm thử playlist & tương tác (Nhóm B)
├── .env.example               # File mẫu biến môi trường
├── next.config.ts             # Cấu hình Next.js (Image CDNs, remotePatterns)
└── package.json
```

---

## 📊 6. Dữ liệu minh họa & Trạng thái hiện tại

- **Dữ liệu demo mẫu**: Các bài hát hiển thị trên Trang chủ và mục Khám phá (`MOCK_SONGS`) là dữ liệu minh họa trải nghiệm người dùng, sử dụng các đoạn âm thanh royalty-free ambient để kiểm tra trình phát nhạc HTML5 và luồng giao diện.
- **Hệ thống tài khoản và Playlist**: Hoạt động thực tế 100% với database LibSQL/SQLite, lưu trữ an toàn mật khẩu (bcrypt), phiên làm việc (SHA-256 hash), playlist cá nhân, bài hát trong playlist, bài hát yêu thích và lịch sử tải nhạc.

---

## ⚖️ 7. Cảnh báo pháp lý & Bản quyền (Legal Disclaimer)

> ⚠️ **LƯU Ý PHÁP LÝ QUAN TRỌNG:**
> - Dự án TikMusic được xây dựng nhằm mục đích học tập, nghiên cứu kỹ thuật công nghệ và minh họa giao diện trải nghiệm người dùng nghe nhạc trực tuyến.
> - Tính năng xử lý hoặc tải nội dung âm thanh từ video TikTok có thể vi phạm **Điều khoản dịch vụ (Terms of Service)** của nền tảng TikTok cũng như các quy định về **Bản quyền tác giả và quyền liên quan (Copyright / DMCA)**.
> - Dự án không lưu trữ bất kỳ tệp âm thanh có bản quyền nào của bên thứ ba trên máy chủ.
> - Trước khi triển khai hoặc công khai dịch vụ ra cộng đồng, chủ sở hữu dự án **cần tham vấn ý kiến pháp lý chuyên nghiệp** và đảm bảo có đầy đủ giấy phép bản quyền âm nhạc theo quy định pháp luật.
