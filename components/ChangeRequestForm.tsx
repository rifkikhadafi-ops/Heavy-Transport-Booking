
import React, { useState, useEffect } from 'react';
import { EquipmentType, BookingRequest, JobStatus } from '../types';
import { enhanceJobDescription } from '../services/geminiService';

interface ChangeRequestFormProps {
  bookings: BookingRequest[];
  onUpdate: (updatedBooking: BookingRequest) => void;
}

const ChangeRequestForm: React.FC<ChangeRequestFormProps> = ({ bookings, onUpdate }) => {
  const [selectedId, setSelectedId] = useState('');
  const [unit, setUnit] = useState<EquipmentType>(EquipmentType.CRANE);
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingRequest | null>(null);

  // When a booking is selected, fill the form
  useEffect(() => {
    const booking = bookings.find(b => b.id === selectedId);
    if (booking) {
      setCurrentBooking(booking);
      setUnit(booking.unit);
      setDetails(booking.details);
      setDate(booking.date);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
    } else {
      setCurrentBooking(null);
    }
  }, [selectedId, bookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBooking || !unit || !details || !date || !startTime || !endTime) return;
    
    onUpdate({
      ...currentBooking,
      unit,
      details,
      date,
      startTime,
      endTime
    });
  };

  const handleEnhance = async () => {
    if (!details.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhanceJobDescription(details);
    setDetails(enhanced);
    setIsEnhancing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Select Booking ID to Modify</label>
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-lg"
        >
          <option value="">-- Choose a Request ID --</option>
          {bookings.filter(b => b.status !== JobStatus.CLOSE).map(b => (
            <option key={b.id} value={b.id}>{b.id} | {b.unit} | {b.date}</option>
          ))}
        </select>
        {bookings.filter(b => b.status !== JobStatus.CLOSE).length === 0 && (
          <p className="mt-2 text-xs text-rose-500 italic">No active requests available to modify.</p>
        )}
      </div>

      {currentBooking && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Edit Request: {selectedId}</h2>
              <p className="text-blue-100 text-sm">Update the information below and re-submit for approval.</p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">
              Current Status: {currentBooking.status}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Update Unit Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(EquipmentType).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUnit(type)}
                      className={`p-3 text-sm rounded-xl border transition-all text-left flex items-center justify-between ${unit === type ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      {type}
                      {unit === type && <i className="fa-solid fa-circle-check"></i>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Update Schedule</label>
                <div className="space-y-3">
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Start Time</span>
                      <input 
                        type="time" 
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">End Time (Est)</span>
                      <input 
                        type="time" 
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Update Work Details</label>
                <button 
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !details}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 disabled:opacity-50"
                >
                  <i className={`fa-solid ${isEnhancing ? 'fa-spinner fa-spin' : 'fa-wand-sparkles'}`}></i>
                  <span>{isEnhancing ? 'Enhancing...' : 'AI Enhance Detail'}</span>
                </button>
              </div>
              <textarea 
                required
                rows={4}
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setSelectedId('')}
                className="text-slate-400 hover:text-slate-600 font-bold transition-all"
              >
                Cancel Changes
              </button>
              <button 
                type="submit"
                className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center space-x-2"
              >
                <span>Update & Notify WA</span>
                <i className="fa-solid fa-rotate"></i>
              </button>
            </div>
          </form>
        </div>
      )}

      {!currentBooking && selectedId === '' && (
        <div className="py-20 text-center text-slate-400">
          <i className="fa-solid fa-magnifying-glass text-4xl mb-4 opacity-20"></i>
          <p>Please select a request ID from the list above to start making changes.</p>
        </div>
      )}
    </div>
  );
};

export default ChangeRequestForm;
