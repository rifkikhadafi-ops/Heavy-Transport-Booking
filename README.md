
# SCM Heavy Transport Booking System

Aksi cepat untuk manajemen transportasi alat berat SCM.

## Cara Mendapatkan Link Web (Deployment)

Untuk mendapatkan link yang bisa diakses oleh siapa saja (publik), ikuti langkah mudah ini:

### 1. Menggunakan Vercel (Paling Cepat & Gratis)
1. Buat akun di [Vercel](https://vercel.com).
2. Install Vercel CLI atau hubungkan akun GitHub Anda.
3. Klik "Add New Project" dan pilih repositori yang berisi file ini.
4. Vercel akan otomatis memberikan link seperti `scm-transport.vercel.app`.

### 2. Menggunakan Netlify
1. Drag & drop folder aplikasi ini ke [Netlify Drop](https://app.netlify.com/drop).
2. Anda akan mendapatkan link publik secara instan.

### Fitur Utama:
- **Dashboard**: Memantau status Requested, On Progress, Pending, dan Close.
- **AI Enhancement**: Menggunakan Gemini AI untuk memperbaiki deskripsi pekerjaan teknis.
- **WhatsApp Simulation**: Simulasi fitur `/CLOSE` untuk merubah status secara otomatis.
- **Auto-Save**: Data tersimpan otomatis di browser (LocalStorage).

### Menjalankan di Lokal:
```bash
npm install
npm run dev
```

Pastikan Anda memiliki file `.env` dengan variabel `API_KEY` dari Google AI Studio jika ingin fitur AI tetap aktif.
