
import React, { useState } from 'react';
import { EquipmentType, BookingRequest } from '../types';
import { enhanceJobDescription } from '../services/geminiService';

interface RequestFormProps {
  onSubmit: (request: Omit<BookingRequest, 'id' | 'status' | 'requestedAt' | 'waMessageId'>) => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ onSubmit }) => {
  const [unit, setUnit] = useState<EquipmentType>(EquipmentType.CRANE);
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !details || !date || !startTime || !endTime) return;
    onSubmit({ unit, details, date, startTime, endTime });
  };

  const handleEnhance = async () => {
    if (!details.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhanceJobDescription(details);
    setDetails(enhanced);
    setIsEnhancing(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 md:px-8 py-4 md:py-6 text-white text-center md:text-left">
        <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight">New Booking</h2>
        <p className="text-slate-400 text-xs mt-1">Provide equipment request details.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Type</label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-3">
              {Object.values(EquipmentType).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUnit(type)}
                  className={`p-3 text-xs md:text-sm rounded-xl border transition-all text-left flex items-center justify-between min-h-[48px] ${
                    unit === type 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-black' 
                    : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {type}
                  {unit === type && <i className="fa-solid fa-circle-check"></i>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Schedule</label>
            <div className="space-y-3">
              <input 
                type="date" 
                required
                className="w-full p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Start</span>
                  <input 
                    type="time" 
                    required
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">End (Est)</span>
                  <input 
                    type="time" 
                    required
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Details</label>
            <button 
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !details}
              className="text-[10px] md:text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center space-x-1"
            >
              <i className={`fa-solid ${isEnhancing ? 'fa-spinner fa-spin' : 'fa-wand-sparkles'}`}></i>
              <span>{isEnhancing ? 'UPDATING...' : 'AI ENHANCE'}</span>
            </button>
          </div>
          <textarea 
            required
            rows={4}
            placeholder="Technical details of the work..."
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-xl md:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
          >
            <span>SUBMIT BOOKING</span>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
