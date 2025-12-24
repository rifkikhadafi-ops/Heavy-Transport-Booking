
import React from 'react';
import { BookingRequest, JobStatus } from '../types';
import * as XLSX from 'xlsx';

interface DashboardProps {
  bookings: BookingRequest[];
  updateStatus: (id: string, status: JobStatus) => void;
  deleteBooking: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, updateStatus, deleteBooking }) => {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REQUESTED: return 'bg-blue-500';
      case JobStatus.ON_PROGRESS: return 'bg-amber-500';
      case JobStatus.PENDING: return 'bg-rose-500';
      case JobStatus.CLOSE: return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const handleExport = () => {
    const data = bookings.map(b => ({
      'ID': b.id,
      'Unit': b.unit,
      'Pekerjaan': b.details,
      'Tanggal': b.date,
      'Mulai': b.startTime,
      'Selesai': b.endTime,
      'Status': b.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ops_Data");
    XLSX.writeFile(wb, `SCM_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Mini Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[JobStatus.REQUESTED, JobStatus.ON_PROGRESS, JobStatus.PENDING, JobStatus.CLOSE].map(status => (
          <div key={status} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{status}</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900">{bookings.filter(b => b.status === status).length}</span>
              <div className={`h-2 w-8 rounded-full ${getStatusColor(status)}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Pekerjaan Aktif</h3>
          <button onClick={handleExport} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-all">
            <i className="fa-solid fa-file-excel"></i>
            EXPORT EXCEL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Informasi Unit</th>
                <th className="px-6 py-4">Waktu & Jadwal</th>
                <th className="px-6 py-4">Status Broadcast</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-blue-600 text-sm">{b.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">{b.unit}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{b.details}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{b.date}</span>
                      <span className="text-[10px] font-mono text-slate-400">{b.startTime} - {b.endTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <select 
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as JobStatus)}
                        className="bg-slate-100 border-none rounded-lg p-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <button onClick={() => { if(window.confirm('Hapus?')) deleteBooking(b.id) }} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 hover:bg-rose-100">
                         <i className="fa-solid fa-trash-can text-xs"></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="p-12 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">Data Kosong</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
