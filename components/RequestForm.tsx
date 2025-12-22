
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
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-8 py-6 text-white">
        <h2 className="text-xl font-bold">New Booking Form</h2>
        <p className="text-slate-400 text-sm">Please provide complete information for the heavy equipment request.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Unit Type</label>
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
            <label className="text-sm font-semibold text-slate-700">Job Schedule</label>
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
            <label className="text-sm font-semibold text-slate-700">Work Details</label>
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
            placeholder="Describe the technical work to be performed..."
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit"
            className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center space-x-2"
          >
            <span>Submit Request</span>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;
