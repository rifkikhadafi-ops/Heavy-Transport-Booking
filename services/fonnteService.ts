
/**
 * Fonnte Service - Dedicated SCM Transport
 * Only uses hardcoded credentials to ensure reliability.
 */

const CONFIG = {
  token: 'gbEKgb8a9AETB3j7ajST',
  target: '120363403134308128@g.us'
};

export const sendWhatsAppMessage = async (message: string): Promise<{ success: boolean; message: string; rawResponse?: any }> => {
  try {
    const formData = new FormData();
    formData.append('token', CONFIG.token);
    formData.append('target', CONFIG.target);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === true) {
      return { success: true, message: "Pesan WhatsApp terkirim!", rawResponse: result };
    } else {
      return { 
        success: false, 
        message: result.reason || "Invalid Token / Device Disconnected", 
        rawResponse: result 
      };
    }
  } catch (error: any) {
    console.error("Fonnte Error:", error);
    return { 
      success: false, 
      message: "Koneksi ke API Fonnte gagal. Cek internet." 
    };
  }
};

// These functions are kept for interface compatibility but no longer modify state
export const saveFonnteConfig = (token: string, target: string) => {
  console.log("Configuration is now hardcoded for stability.");
};

export const resetFonnteConfig = () => {
  console.log("Configuration is now hardcoded for stability.");
};
