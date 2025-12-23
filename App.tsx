
import React, { useState, useEffect, useCallback } from 'react';
import { JobStatus, BookingRequest, WhatsAppNotification } from './types';
import { supabase, testConnection } from './services/supabaseClient';
import { sendWhatsAppMessage, saveFonnteConfig } from './services/fonnteService';
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
  
  // Fonnte State
  const [showFonnteSettings, setShowFonnteSettings] = useState(false);
  const [fonnteToken, setFonnteToken] = useState(localStorage.getItem('FONNTE_TOKEN') || '');
  const [fonnteTarget, setFonnteTarget] = useState(localStorage.getItem('FONNTE_TARGET') || '');

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

    const channel = supabase
      .channel('realtime-scm-sync')
      .on('postgres_changes', { event: '*', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newBooking = payload.new as BookingRequest;
          setBookings(prev => prev.some(b => b.id === newBooking.id) ? prev : [newBooking, ...prev]);
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
      .on('postgres_changes', { event: '*', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotif = payload.new as WhatsAppNotification;
          setNotifications(prev => prev.some(n => n.id === newNotif.id) ? prev : [newNotif, ...prev]);
        }
        else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const generateNextId = () => {
    if (bookings.length === 0) return 'REQ-00001';
    const usedNumbers = bookings
      .map(b => {
        const match = b.id.match(/REQ-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    let nextNum = 1;
    for (const num of usedNumbers) {
      if (num === nextNum) nextNum++;
      else if (num > nextNum) break;
    }
    return `REQ-${String(nextNum).padStart(5, '0')}`;
  };

  const handleNewRequest = async (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => {
    setErrorMessage(null);
    try {
      const id = generateNextId();
      const request: BookingRequest = { 
        ...newRequest, 
        id, 
        status: JobStatus.REQUESTED, 
        requestedAt: Date.now() 
      };
      
      const { error: bError } = await supabase.from('bookings').insert(request);
      if (bError) throw bError;

      // --- INTEGRASI FONNTE (OUTBOUND) ---
      const waContent = `*[NEW BOOKING]*\nID: ${id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\n\nKetik /CLOSE ${id} untuk menutup.`;
      
      // Kirim via Fonnte
      const fonnteRes = await sendWhatsAppMessage(waContent);
      
      // Simpan notifikasi ke DB (untuk UI Group Chat)
      const newNotif = {
        id: `WA-${Date.now()}`, requestId: id, sender: '+6282220454042',
        content: waContent + (fonnteRes.success ? "" : "\n\n(⚠️ Gagal kirim WA: " + fonnteRes.message + ")"),
        timestamp: Date.now(), isSystem: true
      };

      await supabase.from('notifications').insert(newNotif);
      
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleUpdateBooking = async (updatedData: BookingRequest) => {
    try {
      const { error } = await supabase.from('bookings').update(updatedData).eq('id', updatedData.id);
      if (error) throw error;
      
      const updateMsg = `*[UPDATE BOOKING]*\nID: ${updatedData.id}\nStatus: ${updatedData.status}\nUnit: ${updatedData.unit}\nJadwal: ${updatedData.date} (${updatedData.startTime}-${updatedData.endTime})`;
      await sendWhatsAppMessage(updateMsg);

      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal update: ${err.message}`);
    }
  };

  const updateStatus = async (id: string, newStatus: JobStatus) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      await sendWhatsAppMessage(`*[STATUS UPDATE]*\nID: ${id} kini berstatus: *${newStatus}*`);
    } catch (err: any) {
      setErrorMessage(`Gagal update status: ${err.message}`);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await supabase.from('bookings').delete().eq('id', id);
      await supabase.from('notifications').delete().eq('requestId', id);
      await sendWhatsAppMessage(`*[CANCELLED]*\nBooking ID ${id} telah dihapus dari sistem.`);
    } catch (err: any) {
      setErrorMessage(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleGroupChatMessage = async (text: string) => {
    try {
      const userNotif = { 
        id: `USER-${Date.now()}`, requestId: 'USER-CHAT', sender: 'Operator', 
        content: text, timestamp: Date.now(), isSystem: false 
      };
      await supabase.from('notifications').insert(userNotif);

      // Simulasi lokal perintah, di dunia nyata ini ditangani oleh Webhook Fonnte -> Supabase
      const commandText = text.toUpperCase();
      const parts = commandText.split(' ');
      if (parts[0] === '/CLOSE' && parts[1]) {
        await updateStatus(parts[1], JobStatus.CLOSE);
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
    }
  };

  const saveFonnte = () => {
    saveFonnteConfig(fonnteToken, fonnteTarget);
    setShowFonnteSettings(false);
    alert("Konfigurasi Fonnte disimpan!");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Tombol Settings Floating */}
      <button 
        onClick={() => setShowFonnteSettings(true)}
        className="fixed top-4 right-4 z-50 h-10 w-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-emerald-600 border border-slate-200"
        title="Fonnte Settings"
      >
        <i className="fa-solid fa-gears"></i>
      </button>

      {/* Modal Fonnte Settings */}
      {showFonnteSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 md:p-8">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center space-x-3">
              <i className="fa-brands fa-whatsapp text-emerald-500"></i>
              <span>FONNTE CONFIG</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">API Token</label>
                <input 
                  type="password"
                  value={fonnteToken}
                  onChange={(e) => setFonnteToken(e.target.value)}
                  placeholder="Paste Fonnte Token here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target (Group ID / Phone)</label>
                <input 
                  type="text"
                  value={fonnteTarget}
                  onChange={(e) => setFonnteTarget(e.target.value)}
                  placeholder="e.g. 62812xxx or GroupID"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => setShowFonnteSettings(false)}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={saveFonnte}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20"
                >
                  SIMPAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              {activeTab.toUpperCase()}
            </h1>
            <p className="text-slate-500 text-sm italic">Fonnte WhatsApp Integration Ready</p>
          </div>
          <div className="flex space-x-2">
            <div className={`flex items-center space-x-2 text-[10px] px-4 py-2 rounded-full font-bold shadow-sm ${
              fonnteToken ? 'bg-emerald-600' : 'bg-slate-400'
            } text-white`}>
              <i className="fa-brands fa-whatsapp"></i>
              <span>FONNTE: {fonnteToken ? 'ACTIVE' : 'OFFLINE'}</span>
            </div>
            <div className={`flex items-center space-x-2 text-[10px] px-4 py-2 rounded-full font-bold shadow-sm ${
              connectionStatus === 'connected' ? 'bg-blue-600' : 'bg-rose-600'
            } text-white`}>
              <i className={`fa-solid ${connectionStatus === 'connected' ? 'fa-bolt' : 'fa-circle-exclamation'}`}></i>
              <span>DB: {connectionStatus === 'connected' ? 'SYNC' : 'ERROR'}</span>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-bold uppercase">
            <span>{errorMessage}</span>
            <button onClick={() => fetchData()} className="text-blue-600 underline ml-4">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p className="font-bold text-xs uppercase">Menyinkronkan...</p>
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
