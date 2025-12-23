/**
 * Fonnte Service
 * Digunakan untuk mengirim pesan WhatsApp melalui API Fonnte
 */

const getFonnteConfig = () => {
  // Menggunakan token dan target default dari user
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
     * Kita menggunakan FormData dan memindahkan 'token' ke dalam body.
     * Kita TIDAK menambahkan header 'Authorization' agar request dianggap 'Simple Request' oleh browser.
     */
    const formData = new FormData();
    formData.append('token', token.trim());
    formData.append('target', target.trim());
    formData.append('message', message);
    formData.append('countryCode', '62'); // Kode negara Indonesia

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      body: formData,
      // PENTING: Jangan tambahkan headers kustom di sini agar tidak kena blokir CORS
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Fonnte API Response:", result);
    
    if (result.status === true) {
      return { success: true, message: "Pesan WhatsApp terkirim!", rawResponse: result };
    } else {
      return { 
        success: false, 
        message: result.reason || "Gagal (Pastikan device di Fonnte berstatus 'Connected')", 
        rawResponse: result 
      };
    }
  } catch (error: any) {
    console.error("Fonnte Fetch Error:", error);
    return { 
      success: false, 
      message: "Gagal menghubungi server Fonnte. Cek koneksi internet atau kendala CORS browser." 
    };
  }
};

export const saveFonnteConfig = (token: string, target: string) => {
  localStorage.setItem('FONNTE_TOKEN', token.trim());
  localStorage.setItem('FONNTE_TARGET', target.trim());
};