
import React, { useState, useEffect, useCallback } from 'react';
import { JobStatus, BookingRequest, WhatsAppNotification } from './types';
import { supabase, testConnection } from './services/supabaseClient';
import { sendWhatsAppMessage } from './services/fonnteService';
import Sidebar from './components/Sidebar';
import RequestForm from './components/RequestForm';
import ChangeRequestForm from './components/ChangeRequestForm';
import Dashboard from './components/Dashboard';
import ScheduleView from './components/ScheduleView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'change-request' | 'schedule'>('dashboard');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .order('requestedAt', { ascending: false });
      
      if (bError) throw bError;

      if (bData) setBookings(bData);
      setConnectionStatus('connected');
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setErrorMessage(`Sinkronisasi Database Gagal: ${err.message}`);
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
      .channel('scm-ops-realtime')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const generateNextId = () => {
    if (bookings.length === 0) return 'SCM-001';
    const usedNumbers = bookings
      .map(b => {
        const match = b.id.match(/SCM-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    let nextNum = 1;
    for (const num of usedNumbers) {
      if (num === nextNum) nextNum++;
      else if (num > nextNum) break;
    }
    return `SCM-${String(nextNum).padStart(3, '0')}`;
  };

  const handleNewRequest = async (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt'>) => {
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

      // Broadcast Baru ke WhatsApp Group
      const waContent = `🚛 *[NOTIFIKASI PEKERJAAN BARU]*\n\n*ID:* ${id}\n*UNIT:* ${request.unit}\n*PEKERJAAN:* ${request.details}\n*JADWAL:* ${request.date}\n*JAM:* ${request.startTime} - ${request.endTime}\n\n_Mohon Tim Terkait Segera Bersiap._\n_Gateway: SCM Operational System_`;
      
      const fonnteRes = await sendWhatsAppMessage(waContent);
      
      if (!fonnteRes.success) {
        setErrorMessage(`⚠️ Data Tersimpan, Tapi WA Gagal: ${fonnteRes.message}`);
      }

      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleUpdateBooking = async (updatedData: BookingRequest) => {
    try {
      const { error } = await supabase.from('bookings').update(updatedData).eq('id', updatedData.id);
      if (error) throw error;

      const updateMsg = `🔄 *[UPDATE PERMINTAAN]*\n\n*ID:* ${updatedData.id}\n*UNIT:* ${updatedData.unit}\n*STATUS:* ${updatedData.status}\n*JADWAL:* ${updatedData.date} (${updatedData.startTime}-${updatedData.endTime})`;
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
      
      const statusMsg = `✅ *[STATUS UPDATE]*\n\nID *${id}* kini berstatus: *${newStatus.toUpperCase()}*`;
      await sendWhatsAppMessage(statusMsg);
    } catch (err: any) {
      setErrorMessage(`Gagal update status: ${err.message}`);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await supabase.from('bookings').delete().eq('id', id);
      await sendWhatsAppMessage(`🗑️ *[PEMBATALAN]*\n\nBooking ID *${id}* telah dihapus/dibatalkan.`);
    } catch (err: any) {
      setErrorMessage(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <i className="fa-solid fa-truck-monster"></i>
               </div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                 Ops Dashboard
               </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 ml-1">Fungsi SCM Heavy Transport</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm">
              <i className="fa-brands fa-whatsapp animate-pulse"></i>
              <span>WA GATEWAY: +6282220454042</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm">
              <i className="fa-solid fa-database"></i>
              <span>DB: {connectionStatus.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-[11px] font-black uppercase animate-bounce">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => fetchData()} className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-rose-100">RE-SYNC</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <i className="fa-solid fa-gear fa-spin text-5xl mb-4 text-slate-200"></i>
            <p className="font-black text-[10px] uppercase tracking-widest">Memuat Sistem...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'dashboard' && <Dashboard bookings={bookings} updateStatus={updateStatus} deleteBooking={deleteBooking} />}
            {activeTab === 'request' && <RequestForm onSubmit={handleNewRequest} />}
            {activeTab === 'change-request' && <ChangeRequestForm bookings={bookings} onUpdate={handleUpdateBooking} onDelete={deleteBooking} />}
            {activeTab === 'schedule' && <ScheduleView bookings={bookings} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
