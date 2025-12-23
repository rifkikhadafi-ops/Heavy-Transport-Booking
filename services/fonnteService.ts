
/**
 * Fonnte Service
 * Digunakan untuk mengirim pesan WhatsApp melalui API Fonnte
 */

const getFonnteConfig = () => {
  // Menggunakan token dan target terbaru sebagai default
  return {
    token: localStorage.getItem('FONNTE_TOKEN') || 'gbEKgb8a9AETB3j7ajST',
    target: localStorage.getItem('FONNTE_TARGET') || 'DWtI8Gsw7zv1uvWuxdrpTw'
  };
};

export const sendWhatsAppMessage = async (message: string): Promise<{ success: boolean; message: string; rawResponse?: any }> => {
  const { token, target } = getFonnteConfig();

  if (!token || !target) {
    return { success: false, message: "Konfigurasi Fonnte (Token/Target) belum diatur." };
  }

  try {
    /**
     * PERBAIKAN CORS:
     * Mengirimkan token di dalam body (FormData) dan menghapus header 'Authorization'.
     * Ini mengubah request menjadi "Simple Request" yang tidak memicu preflight CORS di browser.
     */
    const formData = new FormData();
    formData.append('token', token.trim());
    formData.append('target', target.trim());
    formData.append('message', message);
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      body: formData,
      // Jangan tambahkan headers kustom di sini untuk menghindari preflight CORS
    });

    const result = await response.json();
    console.log("Fonnte API Response:", result);
    
    if (result.status === true) {
      return { success: true, message: "Pesan WhatsApp terkirim!", rawResponse: result };
    } else {
      return { 
        success: false, 
        message: result.reason || "Ditolak oleh Fonnte (Cek status koneksi nomor di dashboard Fonnte)", 
        rawResponse: result 
      };
    }
  } catch (error: any) {
    console.error("Fonnte Fetch Error:", error);
    return { 
      success: false, 
      message: "Gagal menghubungi server Fonnte (Cek Koneksi/CORS). Pastikan internet aktif." 
    };
  }
};

export const saveFonnteConfig = (token: string, target: string) => {
  localStorage.setItem('FONNTE_TOKEN', token.trim());
  localStorage.setItem('FONNTE_TARGET', target.trim());
};
