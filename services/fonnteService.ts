
/**
 * Fonnte Service
 * Digunakan untuk mengirim pesan WhatsApp melalui API Fonnte
 */

const getFonnteConfig = () => {
  return {
    token: localStorage.getItem('FONNTE_TOKEN') || '',
    target: localStorage.getItem('FONNTE_TARGET') || '' // Bisa nomor HP atau ID Grup
  };
};

export const sendWhatsAppMessage = async (message: string): Promise<{ success: boolean; message: string }> => {
  const { token, target } = getFonnteConfig();

  if (!token || !target) {
    console.warn("Fonnte Token atau Target belum diatur.");
    return { success: false, message: "Konfigurasi Fonnte belum lengkap." };
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: new URLSearchParams({
        'target': target,
        'message': message,
        'countryCode': '62' // Default Indonesia
      })
    });

    const result = await response.json();
    
    if (result.status) {
      return { success: true, message: "Pesan WhatsApp terkirim!" };
    } else {
      return { success: false, message: result.reason || "Gagal mengirim pesan via Fonnte." };
    }
  } catch (error: any) {
    console.error("Fonnte API Error:", error);
    return { success: false, message: error.message };
  }
};

export const saveFonnteConfig = (token: string, target: string) => {
  localStorage.setItem('FONNTE_TOKEN', token);
  localStorage.setItem('FONNTE_TARGET', target);
};
