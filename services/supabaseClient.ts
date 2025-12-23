
import { createClient } from '@supabase/supabase-js';

const getKeys = () => {
  const storedUrl = localStorage.getItem('SCM_SUPABASE_URL');
  const storedKey = localStorage.getItem('SCM_SUPABASE_KEY');
  
  return {
    url: process.env.SUPABASE_URL || storedUrl || '',
    key: process.env.SUPABASE_ANON_KEY || storedKey || ''
  };
};

const { url, key } = getKeys();

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');

export const updateSupabaseClient = (newUrl: string, newKey: string) => {
  localStorage.setItem('SCM_SUPABASE_URL', newUrl);
  localStorage.setItem('SCM_SUPABASE_KEY', newKey);
};

export const isSupabaseConfigured = () => {
  const { url, key } = getKeys();
  return url !== '' && key !== '' && !url.includes('placeholder');
};

/**
 * Verifies if the connection is active and tables exist
 */
export const testConnection = async (customUrl?: string, customKey?: string) => {
  try {
    const client = customUrl && customKey 
      ? createClient(customUrl, customKey) 
      : supabase;
      
    const { error } = await client.from('bookings').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        return { success: false, message: 'Tabel "bookings" tidak ditemukan. Pastikan SQL sudah dijalankan di Dashboard Supabase.' };
      }
      return { success: false, message: `Error: ${error.message}` };
    }
    
    return { success: true, message: 'Koneksi Berhasil!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung: ${err.message}` };
  }
};
