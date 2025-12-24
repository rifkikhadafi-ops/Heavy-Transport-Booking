
import React, { useState, useEffect } from 'react';
import { EquipmentType, BookingRequest, JobStatus } from '../types';
import { enhanceJobDescription } from '../services/geminiService';

interface ChangeRequestFormProps {
  bookings: BookingRequest[];
  onUpdate: (updatedBooking: BookingRequest) => void;
  onDelete: (id: string) => void;
}

const ChangeRequestForm: React.FC<ChangeRequestFormProps> = ({ bookings, onUpdate, onDelete }) => {
  const [selectedId, setSelectedId] = useState('');
  const [unit, setUnit] = useState<EquipmentType>(EquipmentType.CRANE);
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingRequest | null>(null);

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

  const handleDelete = () => {
    if (!selectedId) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus permintaan ${selectedId}? Tindakan ini tidak dapat dibatalkan.`)) {
      onDelete(selectedId);
      setSelectedId('');
    }
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
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Pilih ID Pesanan untuk Diubah</label>
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-lg"
        >
          <option value="">-- Pilih ID Permintaan --</option>
          {bookings.filter(b => b.status !== JobStatus.CLOSE).map(b => (
            <option key={b.id} value={b.id}>{b.id} | {b.unit} | {b.date}</option>
          ))}
        </select>
      </div>

      {currentBooking && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Edit Permintaan: {selectedId}</h2>
              <p className="text-blue-100 text-sm italic">Perbarui informasi dan simpan untuk sinkronisasi.</p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">
              Status: {currentBooking.status}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Update Jenis Unit</label>
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
                <label className="text-sm font-semibold text-slate-700">Update Jadwal</label>
                <div className="space-y-3">
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-700"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="time" 
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <input 
                      type="time" 
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Update Detail Pekerjaan</label>
                <button 
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !details}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <i className={`fa-solid ${isEnhancing ? 'fa-spinner fa-spin' : 'fa-wand-sparkles'}`}></i>
                  <span>AI Perbaiki Deskripsi</span>
                </button>
              </div>
              <textarea 
                required
                rows={4}
                className="w-full p-4 rounded-xl border border-slate-200 outline-none text-sm leading-relaxed"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-4 md:justify-between items-center">
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setSelectedId('')}
                  className="text-slate-400 font-bold text-sm px-2"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-4 border border-rose-200 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 text-sm"
                >
                  Hapus Pesanan
                </button>
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Simpan Perubahan</span>
                <i className="fa-solid fa-save"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChangeRequestForm;
