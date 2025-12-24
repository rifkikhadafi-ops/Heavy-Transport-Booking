
import React, { useState, useEffect, useCallback } from 'react';
import { JobStatus, BookingRequest } from './types';
import { supabase, testConnection } from './services/supabaseClient';
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

      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleUpdateBooking = async (updatedData: BookingRequest) => {
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

  const deleteBooking = async (id: string) => {
    try {
      await supabase.from('bookings').delete().eq('id', id);
    } catch (err: any) {
      setErrorMessage(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {activeTab === 'dashboard' ? 'OPERATIONAL BOARD' : 
               activeTab === 'request' ? 'NEW RESERVATION' :
               activeTab === 'change-request' ? 'MODIFY DATA' : 'LIVE TIMELINE'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">SCM Heavy Transport • Internal Management</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className={`flex items-center space-x-2 text-[10px] px-4 py-2.5 rounded-xl font-black shadow-sm border ${
              connectionStatus === 'connected' ? 'bg-white text-blue-600 border-blue-100' : 'bg-white text-rose-600 border-rose-100'
            }`}>
              <i className={`fa-solid ${connectionStatus === 'connected' ? 'fa-cloud-check' : 'fa-circle-exclamation'}`}></i>
              <span>DATABASE: {connectionStatus === 'connected' ? 'CONNECTED' : 'OFFLINE'}</span>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-bold uppercase animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => fetchData()} className="text-blue-600 underline ml-4 hover:no-underline px-4 py-2 bg-white rounded-lg border border-blue-100">RETRY SYNC</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <div className="relative">
              <i className="fa-solid fa-truck-ramp-box text-5xl mb-6 text-slate-200"></i>
              <i className="fa-solid fa-spinner fa-spin absolute -bottom-2 -right-2 text-blue-500 text-xl"></i>
            </div>
            <p className="font-black text-[10px] uppercase tracking-[0.2em]">Mengunduh Data Operasional...</p>
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
