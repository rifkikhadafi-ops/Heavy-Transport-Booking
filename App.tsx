
import React, { useState, useEffect, useCallback } from 'react';
import { JobStatus, BookingRequest, WhatsAppNotification } from './types';
import { supabase, testConnection } from './services/supabaseClient';
import Sidebar from './components/Sidebar';
import RequestForm from './components/RequestForm';
import ChangeRequestForm from './components/ChangeRequestForm';
import Dashboard from './components/Dashboard';
import ScheduleView from './components/ScheduleView';
import LogisticsGroupChat from './components/LogisticsGroupChat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat'>('dashboard');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fungsi Fetch Data Awal
  const fetchData = useCallback(async () => {
    try {
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .order('requestedAt', { ascending: false });
      
      if (bError) throw bError;

      const { data: nData, error: nError } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false });

      if (nError) throw nError;

      if (bData) setBookings(bData);
      if (nData) setNotifications(nData);
      setConnectionStatus('connected');
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setErrorMessage(`Gagal sinkronisasi data: ${err.message}`);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initConnection = async () => {
      setConnectionStatus('checking');
      const test = await testConnection();
      if (test.success) {
        await fetchData();
      } else {
        setConnectionStatus('error');
        setErrorMessage(test.message);
        setIsLoading(false);
      }
    };

    initConnection();

    // --- REALTIME SUBSCRIPTION ---
    const channel = supabase
      .channel('realtime-scm-sync')
      .on('postgres_changes', { event: '*', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newBooking = payload.new as BookingRequest;
          setBookings(prev => {
            const exists = prev.some(b => b.id === newBooking.id);
            return exists ? prev : [newBooking, ...prev];
          });
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedBooking = payload.new as BookingRequest;
          setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
        } 
        else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setBookings(prev => prev.filter(b => b.id !== deletedId));
        }
      })
      .on('postgres_changes', { event: 'INSERT', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as WhatsAppNotification;
        setNotifications(prev => {
          const exists = prev.some(n => n.id === newNotif.id);
          return exists ? prev : [newNotif, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Fungsi untuk menghasilkan ID selanjutnya (Sekuensial & Isi Celah)
  const generateNextId = () => {
    if (bookings.length === 0) return 'REQ-00001';

    // Ambil semua angka dari ID format REQ-XXXXX
    const usedNumbers = bookings
      .map(b => {
        const match = b.id.match(/REQ-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    // Cari angka terkecil yang belum digunakan (start from 1)
    let nextNum = 1;
    for (const num of usedNumbers) {
      if (num === nextNum) {
        nextNum++;
      } else if (num > nextNum) {
        // Celah ditemukan
        break;
      }
    }

    return `REQ-${String(nextNum).padStart(5, '0')}`;
  };

  const handleNewRequest = async (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => {
    setErrorMessage(null);
    try {
      // 1. Generate ID berdasarkan state terbaru
      const id = generateNextId();
      const request: BookingRequest = { 
        ...newRequest, 
        id, 
        status: JobStatus.REQUESTED, 
        requestedAt: Date.now() 
      };
      
      // 2. Simpan ke Database
      const { error: bError } = await supabase.from('bookings').insert(request);
      if (bError) throw bError;

      // 3. Optimistic Update (PENTING: Update state lokal langsung agar ID selanjutnya benar)
      setBookings(prev => [request, ...prev]);

      // 4. Kirim Simulasi Notifikasi WA
      const waMessageId = `WA-MSG-${Date.now()}`;
      const waContent = `*[NEW BOOKING]*\nID: ${id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\n\nKetik /CLOSE ${id} untuk menutup.`;
      
      await supabase.from('notifications').insert({
        id: waMessageId, requestId: id, sender: '+622220454042',
        content: waContent, timestamp: Date.now(), isSystem: true
      });

      // Pindah ke Dashboard
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleUpdateBooking = async (updatedData: BookingRequest) => {
    setErrorMessage(null);
    try {
      const { error } = await supabase.from('bookings').update(updatedData).eq('id', updatedData.id);
      if (error) throw error;
      
      // Update state lokal langsung
      setBookings(prev => prev.map(b => b.id === updatedData.id ? updatedData : b));
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal update: ${err.message}`);
    }
  };

  const updateStatus = async (id: string, newStatus: JobStatus) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      // Update state lokal langsung
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err: any) {
      setErrorMessage(`Gagal update status: ${err.message}`);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      
      // Update state lokal langsung (menghapus item agar celah ID tersedia kembali)
      setBookings(prev => prev.filter(b => b.id !== id));
      
      await supabase.from('notifications').insert({
        id: `DEL-${Date.now()}`, 
        requestId: id, 
        sender: '+622220454042',
        content: `❌ Request ${id} has been deleted from the system.`, 
        timestamp: Date.now(), 
        isSystem: true
      });
    } catch (err: any) {
      setErrorMessage(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleGroupChatMessage = async (text: string) => {
    try {
      const userNotif = { 
        id: `USER-${Date.now()}`, 
        requestId: 'USER-CHAT', 
        sender: 'Operator', 
        content: text, 
        timestamp: Date.now(), 
        isSystem: false 
      };
      await supabase.from('notifications').insert(userNotif);

      const commandText = text.toUpperCase();
      const parts = commandText.split(' ');
      const cmd = parts[0];
      const id = parts[1];

      if (['/CLOSE', '/PENDING', '/CANCEL', '/DELETE'].includes(cmd) && id) {
        if (cmd === '/CLOSE') await updateStatus(id, JobStatus.CLOSE);
        if (cmd === '/PENDING') await updateStatus(id, JobStatus.PENDING);
        if (cmd === '/CANCEL' || cmd === '/DELETE') await deleteBooking(id);
        
        await supabase.from('notifications').insert({ 
          id: `SYS-${Date.now()}`, requestId: id, sender: '+622220454042', 
          content: `✅ Perintah ${cmd} untuk ${id} diproses.`, timestamp: Date.now(), isSystem: true 
        });
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'request': return 'Create Request';
      case 'change-request': return 'Change Request';
      case 'schedule': return 'Live Schedule';
      case 'group-chat': return 'Group Chat';
      default: return 'Angkutan Berat';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">{getHeaderTitle()}</h1>
            <p className="text-slate-500 text-sm italic">Multi-device sync active</p>
          </div>
          <div className={`flex items-center space-x-2 text-[10px] md:text-sm px-4 py-2 rounded-full font-bold transition-all shadow-sm ${
            connectionStatus === 'connected' ? 'bg-emerald-600' : 'bg-rose-600'
          } text-white`}>
            <i className={`fa-solid ${connectionStatus === 'connected' ? 'fa-bolt' : 'fa-circle-exclamation'}`}></i>
            <span>{connectionStatus === 'connected' ? 'REALTIME ONLINE' : connectionStatus === 'checking' ? 'CONNECTING...' : 'OFFLINE'}</span>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <span>{errorMessage}</span>
            <button onClick={() => fetchData()} className="text-blue-600 uppercase underline ml-4 hover:no-underline">Try Sync Again</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p className="font-bold text-xs uppercase tracking-widest">Menyinkronkan Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard bookings={bookings} updateStatus={updateStatus} deleteBooking={deleteBooking} />}
            {activeTab === 'request' && <RequestForm onSubmit={handleNewRequest} />}
            {activeTab === 'change-request' && <ChangeRequestForm bookings={bookings} onUpdate={handleUpdateBooking} onDelete={deleteBooking} />}
            {activeTab === 'schedule' && <ScheduleView bookings={bookings} />}
            {activeTab === 'group-chat' && <LogisticsGroupChat notifications={notifications} onSendMessage={handleGroupChatMessage} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
