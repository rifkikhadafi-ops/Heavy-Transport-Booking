
import React, { useState, useEffect } from 'react';
import { EquipmentType, JobStatus, BookingRequest, WhatsAppNotification } from './types';
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

  // Supabase Setup State
  const [tempUrl, setTempUrl] = useState(localStorage.getItem('SCM_SUPABASE_URL') || '');
  const [tempKey, setTempKey] = useState(localStorage.getItem('SCM_SUPABASE_KEY') || '');
  const [isTesting, setIsTesting] = useState(false);

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
        setConnectionStatus('connected');
        fetchData();
      } else {
        setConnectionStatus('error');
        setErrorMessage(test.message);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: bData } = await supabase
          .from('bookings')
          .select('*')
          .order('requestedAt', { ascending: false });
        
        const { data: nData } = await supabase
          .from('notifications')
          .select('*')
          .order('timestamp', { ascending: false });

        if (bData) setBookings(bData);
        if (nData) setNotifications(nData);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initConnection();

    // Setup Realtime Channels
    const bookingsSub = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', table: 'bookings' }, payload => {
        if (payload.eventType === 'INSERT') {
          setBookings(prev => prev.find(b => b.id === payload.new.id) ? prev : [payload.new as BookingRequest, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new as BookingRequest : b));
        } else if (payload.eventType === 'DELETE') {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    const notificationsSub = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'notifications' }, payload => {
        setNotifications(prev => prev.find(n => n.id === payload.new.id) ? prev : [payload.new as WhatsAppNotification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSub);
      supabase.removeChannel(notificationsSub);
    };
  }, [isConfigured]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setErrorMessage(null);
    
    const test = await testConnection(tempUrl, tempKey);
    
    if (test.success) {
      updateSupabaseClient(tempUrl, tempKey);
      setIsConfigured(true);
      // Wait for re-render or reload
      window.location.reload();
    } else {
      setErrorMessage(test.message);
      setIsTesting(false);
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

  const sendWANotification = async (request: BookingRequest, isUpdate: boolean = false) => {
    const waMessageId = `WA-MSG-${Math.floor(10000 + Math.random() * 90000)}`;
    const header = isUpdate ? '*[UPDATED]*' : '*[NEW BOOKING]*';
    const waContent = `${header}\nID: ${request.id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\nDate: ${request.date}\n\nKetik /CLOSE [ID], /PENDING [ID], atau /CANCEL [ID].`;
    
    await supabase.from('notifications').insert({
      id: waMessageId, requestId: request.id, sender: '+622220454042',
      content: waContent, timestamp: Date.now(), isSystem: true
    });
    return waMessageId;
  };

  const handleNewRequest = async (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => {
    const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const request: BookingRequest = { ...newRequest, id, status: JobStatus.REQUESTED, requestedAt: Date.now() };
    const waId = await sendWANotification(request);
    request.waMessageId = waId;
    await supabase.from('bookings').insert(request);
    setActiveTab('dashboard');
  };

  const handleUpdateBooking = async (updatedData: BookingRequest) => {
    await supabase.from('bookings').update(updatedData).eq('id', updatedData.id);
    await sendWANotification(updatedData, true);
    setActiveTab('dashboard');
  };

  const updateStatus = async (id: string, newStatus: JobStatus) => {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
  };

  const handleGroupChatMessage = async (text: string) => {
    const userNotif = { id: `USER-${Date.now()}`, requestId: 'USER-CHAT', sender: 'Operator', content: text, timestamp: Date.now(), isSystem: false };
    await supabase.from('notifications').insert(userNotif);

    const processCommand = async (command: string, action: (id: string) => Promise<void>, emoji: string, feedback: string) => {
      if (text.toUpperCase().startsWith(command)) {
        const id = text.split(' ')[1]?.toUpperCase();
        if (id && bookings.find(b => b.id === id)) {
          await action(id);
          await supabase.from('notifications').insert({ id: `SYS-${Date.now()}`, requestId: id, sender: '+622220454042', content: `${emoji} ${feedback} ${id}.`, timestamp: Date.now(), isSystem: true });
        } else {
          await supabase.from('notifications').insert({ id: `SYS-${Date.now()}`, requestId: 'ERROR', sender: '+622220454042', content: `❌ ID "${id}" tidak ditemukan.`, timestamp: Date.now(), isSystem: true });
        }
        return true;
      }
      return false;
    };

    await processCommand('/CLOSE', (id) => updateStatus(id, JobStatus.CLOSE), '✅', 'Status CLOSED untuk') ||
    await processCommand('/PENDING', (id) => updateStatus(id, JobStatus.PENDING), '⏳', 'Status PENDING untuk') ||
    await processCommand('/CANCEL', async (id) => { await supabase.from('bookings').delete().eq('id', id); }, '🗑️', 'Request DIHAPUS untuk');
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
            <p className="text-blue-100 text-sm mt-2">Hubungkan aplikasi ke project Supabase Anda.</p>
          </div>
          <form onSubmit={handleSaveConfig} className="p-8 space-y-5">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-bold leading-relaxed flex items-start space-x-2">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supabase URL</label>
              <input 
                type="text" 
                placeholder="https://your-id.supabase.co"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anon Key</label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isTesting}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {isTesting ? 'Mencoba Menghubungkan...' : 'Simpan & Hubungkan'}
              </button>
            </div>
            {isConfigured && (
              <button type="button" onClick={() => setActiveTab('dashboard')} className="w-full text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors">
                Batal & Kembali
              </button>
            )}
          </form>
          <div className="px-8 pb-8 text-[10px] text-slate-400 text-center leading-relaxed">
            Anda bisa menemukan kunci ini di: <br/>
            <strong>Settings > API</strong> di Dashboard Supabase.
          </div>
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
            <p className="text-slate-500 text-sm">Target Group: Model Angber</p>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2 text-[10px] md:text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
              <i className="fa-brands fa-whatsapp"></i>
              <span>+622220454042</span>
            </div>
            <div className={`flex items-center space-x-2 text-[10px] md:text-sm px-3 py-1.5 rounded-full font-bold transition-all shadow-sm ${
              connectionStatus === 'connected' ? 'bg-emerald-600' : 
              connectionStatus === 'error' ? 'bg-rose-600' : 'bg-blue-600'
            } text-white`}>
              <i className={`fa-solid ${
                connectionStatus === 'connected' ? 'fa-circle-check' : 
                connectionStatus === 'error' ? 'fa-circle-exclamation' : 'fa-spinner fa-spin'
              }`}></i>
              <span>{
                connectionStatus === 'connected' ? 'Live DB Online' : 
                connectionStatus === 'error' ? 'Connection Error' : 'Testing Link...'
              }</span>
            </div>
          </div>
        </header>

        {errorMessage && activeTab !== 'settings' && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-rose-700 text-sm font-bold">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setActiveTab('settings')} className="text-xs font-black text-rose-600 underline uppercase">Fix Setup</button>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard bookings={bookings} updateStatus={updateStatus} />}
        {activeTab === 'request' && <RequestForm onSubmit={handleNewRequest} />}
        {activeTab === 'change-request' && <ChangeRequestForm bookings={bookings} onUpdate={handleUpdateBooking} />}
        {activeTab === 'schedule' && <ScheduleView bookings={bookings} />}
        {activeTab === 'group-chat' && <LogisticsGroupChat notifications={notifications} onSendMessage={handleGroupChatMessage} />}
      </main>
    </div>
  );
};

export default App;
