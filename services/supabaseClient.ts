
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  return '';
};

const DEFAULT_URL = 'https://obneuekaiwifgfzvfzcx.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibmV1ZWthaXdpZmdmenZmemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjgzODQsImV4cCI6MjA4MjAwNDM4NH0.UGZHaffga7hYzChPFc9lwhvF7_eMO44L9oOSNAb89jM';

const getKeys = () => {
  const storedUrl = localStorage.getItem('SCM_SUPABASE_URL');
  const storedKey = localStorage.getItem('SCM_SUPABASE_KEY');
  
  return {
    url: getEnvVar('SUPABASE_URL') || storedUrl || DEFAULT_URL,
    key: getEnvVar('SUPABASE_ANON_KEY') || storedKey || DEFAULT_KEY
  };
};

const { url, key } = getKeys();

export const supabase = createClient(url, key);

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
