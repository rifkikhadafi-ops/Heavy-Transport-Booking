
import React, { useState, useEffect, useCallback } from 'react';
import { JobStatus, BookingRequest, WhatsAppNotification } from './types';
import { supabase, isSupabaseConfigured, updateSupabaseClient, testConnection } from './services/supabaseClient';
import Sidebar from './components/Sidebar';
import RequestForm from './components/RequestForm';
import ChangeRequestForm from './components/ChangeRequestForm';
import Dashboard from './components/Dashboard';
import ScheduleView from './components/ScheduleView';
import LogisticsGroupChat from './components/LogisticsGroupChat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat' | 'settings'>('dashboard');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tempUrl, setTempUrl] = useState(localStorage.getItem('SCM_SUPABASE_URL') || '');
  const [tempKey, setTempKey] = useState(localStorage.getItem('SCM_SUPABASE_KEY') || '');
  const [isTesting, setIsTesting] = useState(false);

  // Fungsi Fetch Data Awal
  const fetchData = useCallback(async () => {
    if (!isConfigured) return;
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
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      setConnectionStatus('error');
      setIsLoading(false);
      return;
    }

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

    // --- REALTIME SUBSCRIPTION LOGIC ---
    // Channel ini mendengarkan SEMUA perubahan di tabel bookings dan notifications
    const channel = supabase
      .channel('realtime-scm-sync')
      .on('postgres_changes', { event: '*', table: 'bookings' }, (payload) => {
        console.log('Realtime Booking Change:', payload);
        
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Sistem sinkronisasi aktif!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, fetchData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setErrorMessage(null);
    const test = await testConnection(tempUrl, tempKey);
    if (test.success) {
      updateSupabaseClient(tempUrl, tempKey);
      setIsConfigured(true);
      window.location.reload();
    } else {
      setErrorMessage(test.message);
      setIsTesting(false);
    }
  };

  const handleNewRequest = async (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => {
    setErrorMessage(null);
    try {
      const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const request: BookingRequest = { 
        ...newRequest, 
        id, 
        status: JobStatus.REQUESTED, 
        requestedAt: Date.now() 
      };
      
      const { error: bError } = await supabase.from('bookings').insert(request);
      if (bError) throw bError;

      const waMessageId = `WA-MSG-${Math.floor(10000 + Math.random() * 90000)}`;
      const waContent = `*[NEW BOOKING]*\nID: ${id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\n\nKetik /CLOSE ${id} untuk menutup.`;
      
      await supabase.from('notifications').insert({
        id: waMessageId, requestId: id, sender: '+622220454042',
        content: waContent, timestamp: Date.now(), isSystem: true
      });

      // PENTING: Kita tidak perlu mengupdate state manual di sini karena 
      // subscription Realtime akan menangani penambahan data ke list secara otomatis.
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
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal update: ${err.message}`);
    }
  };

  const updateStatus = async (id: string, newStatus: JobStatus) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(`Gagal update status: ${err.message}`);
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

      if (['/CLOSE', '/PENDING', '/CANCEL'].includes(cmd) && id) {
        if (cmd === '/CLOSE') await updateStatus(id, JobStatus.CLOSE);
        if (cmd === '/PENDING') await updateStatus(id, JobStatus.PENDING);
        if (cmd === '/CANCEL') await supabase.from('bookings').delete().eq('id', id);
        
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
      case 'settings': return 'Database Settings';
      default: return 'Angkutan Berat';
    }
  };

  if (!isConfigured || activeTab === 'settings') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              <i className={`fa-solid ${isTesting ? 'fa-spinner fa-spin' : 'fa-database'}`}></i>
            </div>
            <h2 className="text-2xl font-bold">Database Setup</h2>
          </div>
          <form onSubmit={handleSaveConfig} className="p-8 space-y-5">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-bold leading-relaxed">
                {errorMessage}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supabase URL</label>
              <input type="text" placeholder="https://your-id.supabase.co" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anon Key</label>
              <input type="password" placeholder="Key..." value={tempKey} onChange={(e) => setTempKey(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium" />
            </div>
            <button type="submit" disabled={isTesting} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg text-xs uppercase tracking-widest">
              {isTesting ? 'Mencoba...' : 'Simpan & Hubungkan'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            <span>{connectionStatus === 'connected' ? 'REALTIME ONLINE' : 'OFFLINE'}</span>
          </div>
        </header>

        {errorMessage && activeTab !== 'settings' && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-bold">
            <span>{errorMessage}</span>
            <button onClick={() => fetchData()} className="text-blue-600 uppercase underline ml-4">Sync Now</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p className="font-bold text-xs uppercase tracking-widest">Menyinkronkan Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard bookings={bookings} updateStatus={updateStatus} />}
            {activeTab === 'request' && <RequestForm onSubmit={handleNewRequest} />}
            {activeTab === 'change-request' && <ChangeRequestForm bookings={bookings} onUpdate={handleUpdateBooking} />}
            {activeTab === 'schedule' && <ScheduleView bookings={bookings} />}
            {activeTab === 'group-chat' && <LogisticsGroupChat notifications={notifications} onSendMessage={handleGroupChatMessage} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
