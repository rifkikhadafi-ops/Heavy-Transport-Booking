
import React, { useState, useEffect } from 'react';
import { EquipmentType, JobStatus, BookingRequest, WhatsAppNotification } from './types';
import Sidebar from './components/Sidebar';
import RequestForm from './components/RequestForm';
import ChangeRequestForm from './components/ChangeRequestForm';
import Dashboard from './components/Dashboard';
import ScheduleView from './components/ScheduleView';
import LogisticsGroupChat from './components/LogisticsGroupChat';

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
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat'>('dashboard');
  
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

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'request': return 'Create Request';
      case 'change-request': return 'Change Request';
      case 'schedule': return 'Live Schedule';
      case 'group-chat': return 'Group';
      default: return 'Angkutan Berat';
    }
  };

  const sendWANotification = (request: BookingRequest, isUpdate: boolean = false) => {
    const waMessageId = `WA-MSG-${Math.floor(10000 + Math.random() * 90000)}`;
    const header = isUpdate ? '*[UPDATED]*' : '*[NEW BOOKING]*';
    const waContent = `${header}\nID: ${request.id}\nUnit: ${request.unit}\nJob: ${request.details}\nTime: ${request.startTime} - ${request.endTime}\nDate: ${request.date}\n\nKetik /CLOSE [ID], /PENDING [ID], atau /CANCEL [ID].`;
    
    setNotifications(prev => [{
      id: waMessageId,
      requestId: request.id,
      sender: '+622220454042',
      content: waContent,
      timestamp: Date.now(),
      isSystem: true
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

  const handleGroupChatMessage = (text: string) => {
    const userMsgId = `USER-${Date.now()}`;
    const upperText = text.toUpperCase();
    
    setNotifications(prev => [{
      id: userMsgId,
      requestId: 'USER-CHAT',
      sender: 'Operator',
      content: text,
      timestamp: Date.now(),
      isSystem: false
    }, ...prev]);

    const processCommand = (command: string, action: (id: string) => void, feedbackEmoji: string, feedbackText: string) => {
      if (upperText.startsWith(command)) {
        const parts = text.split(' ');
        if (parts.length >= 2) {
          const targetReqId = parts[1].toUpperCase();
          const booking = bookings.find(b => b.id === targetReqId);
          
          if (booking) {
            action(targetReqId);
            setTimeout(() => {
              setNotifications(prev => [{
                id: `SYS-${Date.now()}`,
                requestId: targetReqId,
                sender: '+622220454042',
                content: `${feedbackEmoji} ${feedbackText} ${targetReqId}.`,
                timestamp: Date.now(),
                isSystem: true
              }, ...prev]);
            }, 800);
          } else {
            setTimeout(() => {
              setNotifications(prev => [{
                id: `SYS-${Date.now()}`,
                requestId: 'ERROR',
                sender: '+622220454042',
                content: `❌ Gagal: Request ID "${targetReqId}" tidak ditemukan.`,
                timestamp: Date.now(),
                isSystem: true
              }, ...prev]);
            }, 800);
          }
        } else {
          setTimeout(() => {
            setNotifications(prev => [{
              id: `SYS-${Date.now()}`,
              requestId: 'ERROR',
              sender: '+622220454042',
              content: `❌ Gunakan format: ${command} [REQ-ID]\nContoh: ${command} REQ-1234`,
              timestamp: Date.now(),
              isSystem: true
            }, ...prev]);
          }, 800);
        }
        return true;
      }
      return false;
    };

    const handled = 
      processCommand('/CLOSE', (id) => updateStatus(id, JobStatus.CLOSE), '✅', 'Status request telah diubah menjadi CLOSED untuk') ||
      processCommand('/PENDING', (id) => updateStatus(id, JobStatus.PENDING), '⏳', 'Status request telah diubah menjadi PENDING untuk') ||
      processCommand('/CANCEL', (id) => setBookings(prev => prev.filter(b => b.id !== id)), '🗑️', 'Request telah DIHAPUS dari daftar untuk');

    if (!handled && text.startsWith('/')) {
      setTimeout(() => {
        setNotifications(prev => [{
          id: `SYS-${Date.now()}`,
          requestId: 'HELP',
          sender: '+622220454042',
          content: `🤖 Perintah tidak dikenal. Gunakan:\n/CLOSE [ID]\n/PENDING [ID]\n/CANCEL [ID]`,
          timestamp: Date.now(),
          isSystem: true
        }, ...prev]);
      }, 800);
    }
  };

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
            <div className="flex items-center space-x-2 text-[10px] md:text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">
              <span>System Live</span>
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

        {activeTab === 'group-chat' && (
          <LogisticsGroupChat 
            notifications={notifications} 
            onSendMessage={handleGroupChatMessage} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
