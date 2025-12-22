
import React, { useState, useEffect } from 'react';
import { EquipmentType, JobStatus, BookingRequest, WhatsAppNotification } from './types';
import Sidebar from './components/Sidebar';
import RequestForm from './components/RequestForm';
import ChangeRequestForm from './components/ChangeRequestForm';
import Dashboard from './components/Dashboard';
import ScheduleView from './components/ScheduleView';
import WAWebHookSimulator from './components/WAWebHookSimulator';

const INITIAL_DATA: BookingRequest[] = [
  {
    id: 'REQ-001',
    unit: EquipmentType.CRANE,
    details: 'Lifting heavy generator set at Area A Zone 4.',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    status: JobStatus.REQUESTED,
    requestedAt: Date.now() - 3600000,
    waMessageId: 'WA-MSG-101'
  },
  {
    id: 'REQ-002',
    unit: EquipmentType.PRIMEMOVER,
    details: 'Transporting drill pipe to Rig 12.',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    endTime: '17:30',
    status: JobStatus.ON_PROGRESS,
    requestedAt: Date.now() - 7200000,
    waMessageId: 'WA-MSG-102'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'change-request' | 'schedule' | 'simulator'>('dashboard');
  
  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    const saved = localStorage.getItem('scm_bookings');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [notifications, setNotifications] = useState<WhatsAppNotification[]>(() => {
    const saved = localStorage.getItem('scm_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('scm_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('scm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const sendWANotification = (request: BookingRequest, isUpdate: boolean = false) => {
    const waMessageId = `WA-MSG-${Math.floor(10000 + Math.random() * 90000)}`;
    const header = isUpdate ? '*UPDATED BOOKING REQUEST*' : '*NEW BOOKING REQUEST*';
    const waContent = `${header}\nID: ${request.id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\nDate: ${request.date}\n\nMention this message and type /CLOSE when finished.`;
    
    setNotifications(prev => [{
      id: waMessageId,
      requestId: request.id,
      content: waContent,
      timestamp: Date.now()
    }, ...prev]);

    return waMessageId;
  };

  const handleNewRequest = (newRequest: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => {
    const id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const request: BookingRequest = {
      ...newRequest,
      id,
      status: JobStatus.REQUESTED,
      requestedAt: Date.now(),
    };

    const waId = sendWANotification(request);
    request.waMessageId = waId;

    setBookings(prev => [request, ...prev]);
    setActiveTab('dashboard');
  };

  const handleUpdateBooking = (updatedData: BookingRequest) => {
    setBookings(prev => prev.map(b => b.id === updatedData.id ? updatedData : b));
    sendWANotification(updatedData, true);
    setActiveTab('dashboard');
  };

  const updateStatus = (id: string, newStatus: JobStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleWASimulatorCommand = (command: string, targetMsgId: string) => {
    if (command === '/CLOSE') {
      const notification = notifications.find(n => n.id === targetMsgId);
      if (notification) {
        updateStatus(notification.requestId, JobStatus.CLOSE);
        return `Request ${notification.requestId} has been CLOSED via WhatsApp Simulator.`;
      }
    }
    return 'Command not recognized or message ID invalid.';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Heavy Transport Booking</h1>
            <p className="text-slate-500">Logistics Control Tower</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              <i className="fa-solid fa-database"></i>
              <span>LocalStorage Sync Active</span>
            </div>
            <div className="flex items-center space-x-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>WA Bot Active</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard bookings={bookings} updateStatus={updateStatus} />
        )}
        
        {activeTab === 'request' && (
          <RequestForm onSubmit={handleNewRequest} />
        )}

        {activeTab === 'change-request' && (
          <ChangeRequestForm bookings={bookings} onUpdate={handleUpdateBooking} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView bookings={bookings} />
        )}

        {activeTab === 'simulator' && (
          <WAWebHookSimulator 
            notifications={notifications} 
            onSendCommand={handleWASimulatorCommand} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
