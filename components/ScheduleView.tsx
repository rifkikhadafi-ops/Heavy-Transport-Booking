
import React, { useState, useEffect } from 'react';
import { BookingRequest, EquipmentType, JobStatus } from '../types';

interface ScheduleViewProps {
  bookings: BookingRequest[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ bookings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);

  // Calculate position for the "current time" red line
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (today === selectedDate) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = (hours * 60) + minutes;
        // Map 0-1440 minutes to 0-100%
        setCurrentTimePos((totalMinutes / 1440) * 100);
      } else {
        setCurrentTimePos(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const filteredBookings = bookings.filter(b => b.date === selectedDate);

  const timeToPercent = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getStatusBg = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REQUESTED: return 'bg-blue-500';
      case JobStatus.ON_PROGRESS: return 'bg-amber-500';
      case JobStatus.PENDING: return 'bg-rose-500';
      case JobStatus.CLOSE: return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Operations Timeline</h2>
          <p className="text-sm text-slate-400">Resource allocation and job tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-4 font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
             onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Timeline Header (Hours) */}
        <div className="flex border-b border-slate-100">
          <div className="w-40 min-w-[160px] p-4 bg-slate-50 font-bold text-xs text-slate-400 uppercase tracking-wider border-r border-slate-100">
            Resources
          </div>
          <div className="flex-1 relative flex overflow-x-auto min-h-[50px]">
            {hours.map(h => (
              <div key={h} className="flex-1 min-w-[60px] border-r border-slate-50 text-[10px] text-slate-400 p-2 font-mono flex items-end justify-center">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Content */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {Object.values(EquipmentType).map(type => (
            <div key={type} className="flex group hover:bg-slate-50/50 transition-colors">
              <div className="w-40 min-w-[160px] p-4 border-r border-slate-100 flex items-center">
                <span className="font-bold text-sm text-slate-700">{type}</span>
              </div>
              <div className="flex-1 min-w-[1440px] h-20 relative bg-grid-slate-100">
                {/* Visual Grid Lines */}
                {hours.map(h => (
                  <div key={h} className="absolute top-0 bottom-0 border-r border-slate-100/50" style={{ left: `${(h/24)*100}%` }}></div>
                ))}

                {/* Job Blocks */}
                {filteredBookings.filter(b => b.unit === type).map(booking => {
                  const start = timeToPercent(booking.startTime);
                  const end = timeToPercent(booking.endTime);
                  const width = end - start;

                  return (
                    <div 
                      key={booking.id}
                      className={`absolute top-3 bottom-3 rounded-lg shadow-sm px-3 py-1 text-white overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10 ${getStatusBg(booking.status)}`}
                      style={{ left: `${start}%`, width: `${width}%` }}
                      title={`${booking.id}: ${booking.details}`}
                    >
                      <div className="text-[10px] font-black uppercase leading-tight truncate">{booking.id}</div>
                      <div className="text-[9px] font-medium opacity-90 truncate leading-tight">{booking.startTime}-{booking.endTime}</div>
                      <div className="text-[9px] font-bold mt-1 truncate">{booking.status}</div>
                    </div>
                  );
                })}

                {/* Current Time Line */}
                {currentTimePos !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                    style={{ left: `${currentTimePos}%` }}
                  >
                    <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Requested</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-amber-500"></div>
          <span>On Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-rose-500"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span>Closed</span>
        </div>
        <div className="ml-auto italic text-slate-300">
          Tip: Horizontal grid shows full 24hr cycle.
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
