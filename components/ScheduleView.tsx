
import React, { useState, useEffect } from 'react';
import { BookingRequest, EquipmentType, JobStatus } from '../types';

interface ScheduleViewProps {
  bookings: BookingRequest[];
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ bookings }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (today === selectedDate) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = (hours * 60) + minutes;
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
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Operational Timeline</h2>
          <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-tighter">Live Allocation Chart</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-3 md:px-4 font-bold text-sm md:text-base text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
          <button 
             onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="md:hidden absolute top-0 right-0 p-2 text-[9px] font-bold text-slate-300 pointer-events-none z-30">
          <i className="fa-solid fa-arrows-left-right mr-1"></i> Swipe to scroll
        </div>
        
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-[1000px] md:min-w-[1440px]">
            {/* Timeline Header (Hours) */}
            <div className="flex border-b border-slate-100">
              <div className="w-32 md:w-40 p-4 bg-slate-50 font-black text-[10px] text-slate-400 uppercase border-r border-slate-100 sticky left-0 z-30">
                Resource
              </div>
              <div className="flex-1 flex bg-slate-50/50">
                {hours.map(h => (
                  <div key={h} className="flex-1 border-r border-slate-100/50 text-[10px] text-slate-400 p-2 font-mono flex items-end justify-center">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="divide-y divide-slate-100">
              {Object.values(EquipmentType).map(type => (
                <div key={type} className="flex group hover:bg-slate-50/30 transition-colors">
                  <div className="w-32 md:w-40 p-4 border-r border-slate-100 flex items-center sticky left-0 z-30 bg-white group-hover:bg-slate-50">
                    <span className="font-bold text-xs md:text-sm text-slate-700 truncate">{type}</span>
                  </div>
                  <div className="flex-1 h-16 md:h-20 relative bg-[size:20px_20px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)]">
                    {/* Visual Grid Lines */}
                    {hours.map(h => (
                      <div key={h} className="absolute top-0 bottom-0 border-r border-slate-100/30" style={{ left: `${(h/24)*100}%` }}></div>
                    ))}

                    {/* Job Blocks */}
                    {filteredBookings.filter(b => b.unit === type).map(booking => {
                      const start = timeToPercent(booking.startTime);
                      const end = timeToPercent(booking.endTime);
                      const width = Math.max(end - start, 2); // Minimum width for visibility

                      return (
                        <div 
                          key={booking.id}
                          className={`absolute top-2 bottom-2 rounded-lg shadow-sm px-2 py-1 text-white overflow-hidden cursor-pointer active:scale-95 transition-all z-10 flex flex-col justify-center ${getStatusBg(booking.status)}`}
                          style={{ left: `${start}%`, width: `${width}%` }}
                        >
                          <div className="text-[9px] md:text-[10px] font-black leading-none truncate mb-0.5">{booking.id}</div>
                          <div className="text-[8px] md:text-[9px] font-medium opacity-90 truncate leading-none">{booking.startTime}-{booking.endTime}</div>
                        </div>
                      );
                    })}

                    {/* Current Time Line */}
                    {currentTimePos !== null && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20" 
                        style={{ left: `${currentTimePos}%` }}
                      >
                        <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 bg-white p-3 md:p-4 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-blue-500"></div>
          <span>Req</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
          <span>Prog</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-rose-500"></div>
          <span>Pend</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
