
/**
 * Fonnte Service
 * Digunakan untuk mengirim pesan WhatsApp melalui API Fonnte
 */

const getFonnteConfig = () => {
  // Prioritas: LocalStorage (User Input) -> Default Hardcoded
  const storedToken = localStorage.getItem('FONNTE_TOKEN');
  const storedTarget = localStorage.getItem('FONNTE_TARGET');
  
  return {
    token: (storedToken && storedToken !== 'undefined') ? storedToken.trim() : 'gbEKgb8a9AETB3j7ajST',
    // Diperbarui ke ID Group yang diberikan: 120363403134308128@g.us
    target: (storedTarget && storedTarget !== 'undefined') ? storedTarget.trim() : '120363403134308128@g.us'
  };
};

export const sendWhatsAppMessage = async (message: string): Promise<{ success: boolean; message: string; rawResponse?: any }> => {
  const { token, target } = getFonnteConfig();

  if (!token || token.length < 5) {
    return { success: false, message: "Token Fonnte tidak valid atau belum diisi." };
  }

  try {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('target', target);
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

export const saveFonnteConfig = (token: string, target: string) => {
  localStorage.setItem('FONNTE_TOKEN', token.trim());
  localStorage.setItem('FONNTE_TARGET', target.trim());
};

export const resetFonnteConfig = () => {
  localStorage.removeItem('FONNTE_TOKEN');
  localStorage.removeItem('FONNTE_TARGET');
};
