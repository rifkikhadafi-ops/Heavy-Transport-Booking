
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  try {
    // Safely check for process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Fail silently in environments where process is not defined
  }
  return '';
};

const getKeys = () => {
  const storedUrl = localStorage.getItem('SCM_SUPABASE_URL');
  const storedKey = localStorage.getItem('SCM_SUPABASE_KEY');
  
  return {
    url: getEnvVar('SUPABASE_URL') || storedUrl || '',
    key: getEnvVar('SUPABASE_ANON_KEY') || storedKey || ''
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
