# 🏪 WarungKasbon - Aplikasi Pencatatan Hutang Warung (Offline-First)

Aplikasi pencatatan kasbon dan piutang pelanggan untuk warung/toko kelontong sederhana dengan arsitektur **Offline-First**. Transaksi dapat dicatat kapan saja tanpa internet, dan akan tersinkronisasi otomatis saat terhubung ke cloud server.

---

## 📁 Struktur Direktori

```text
warung-kasbon/
├── backend/              # Node.js + TypeScript REST API Server
│   ├── src/
│   │   ├── config/       # Konfigurasi database & environment
│   │   ├── controllers/  # Handler API (Sync, Customer, Transaction)
│   │   ├── services/     # Logika bisnis & sinkronisasi
│   │   ├── types/        # Model data TypeScript
│   │   └── server.ts     # Entrypoint server Express
│   ├── package.json
│   └── tsconfig.json
│
└── mobile/               # React Native (Expo) Mobile App
    ├── src/
    │   ├── components/   # Komponen UI (Numpad, Pelanggan, Quick Chips)
    │   ├── database/     # SQLite client lokal & query
    │   ├── screens/      # Layar Dashboard, Catat Kasbon, Bayar
    │   ├── services/     # Engine Sinkronisasi & WhatsApp Generator
    │   └── types/        # TypeScript types
    ├── App.tsx           # Entrypoint aplikasi HP
    ├── app.json          # Konfigurasi Expo
    └── package.json
```

---

## 🚀 Panduan Memulai Cepat

### 1. Menjalankan Backend (Server)
```bash
cd backend
pnpm install
pnpm dev
```
Server akan berjalan di `http://localhost:5000`.

### 2. Menjalankan Mobile App (React Native / Expo)
```bash
cd mobile
pnpm install
pnpm start
```
Buka aplikasi **Expo Go** di HP Android Anda, lalu scan QR code yang muncul di terminal.

---

## 💡 Fitur Utama
1. **Offline-First:** Tetap bisa input transaksi meski sinyal di warung hilang.
2. **Fast-Input Mode:** Catat kasbon dalam waktu < 5 detik dengan tombol nominal cepat dan chips nama barang.
3. **Kirim Nota WhatsApp:** Kirim rincian kasbon atau pengingat tagihan ramah dalam satu sentuhan langsung ke WhatsApp pelanggan.
4. **Auto-Sync:** Data lokal di HP otomatis disinkronkan ke server cloud saat internet online.
