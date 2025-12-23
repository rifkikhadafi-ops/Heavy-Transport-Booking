
# SCM Heavy Transport - Panduan Integrasi WhatsApp Asli

Aplikasi ini sekarang terhubung dengan **Fonnte**. Setiap pemesanan akan otomatis mengirim pesan ke WhatsApp Grup.

## 🛠️ Langkah Selanjutnya: Aktivasi Fitur /CLOSE

Agar Anda bisa mengetik `/CLOSE REQ-xxxxx` di WhatsApp dan status di web berubah otomatis, ikuti langkah ini:

### 1. Siapkan Database di Supabase
Pastikan tabel `bookings` Anda memiliki kolom `status`. Jika Anda menggunakan kode saya, ini sudah ada.

### 2. Buat "Supabase Edge Function"
Buka terminal di project Anda dan buat fungsi baru (atau gunakan dashboard Supabase):
```bash
supabase functions new fonnte-webhook
```

Gunakan kode berikut untuk file `index.ts` di Edge Function tersebut:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { message, sender } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Cek apakah pesan mengandung perintah /CLOSE
  const text = message.toUpperCase()
  if (text.startsWith('/CLOSE ')) {
    const requestId = text.split(' ')[1]
    
    // Update status di database
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'Close' })
      .eq('id', requestId)

    if (!error) {
      // Kirim balasan konfirmasi (Opsional) ke Fonnte
      return new Response(JSON.stringify({ status: true, message: 'Berhasil ditutup' }), { headers: { "Content-Type": "application/json" } })
    }
  }

  return new Response(JSON.stringify({ status: false }), { status: 200 })
})
```

### 3. Daftarkan URL Webhook di Fonnte
1. Deploy fungsi di atas: `supabase functions deploy fonnte-webhook`.
2. Salin URL yang diberikan (contoh: `https://xxxx.supabase.co/functions/v1/fonnte-webhook`).
3. Buka Dashboard Fonnte -> Menu **Webhook**.
4. Masukkan URL tersebut ke kolom **Webhook URL**.
5. Klik **Simpan**.

---

## 🚀 Selesai!
Sekarang, alur kerja tim Anda:
1. **Operator** buat booking di Web.
2. **Grup WhatsApp** terima notifikasi otomatis.
3. **Pekerja Lapangan** ketik `/CLOSE REQ-00001` saat selesai.
4. **Dashboard Web** langsung berubah warna jadi hijau secara real-time!
