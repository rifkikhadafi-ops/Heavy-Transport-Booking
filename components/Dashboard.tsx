
import React from 'react';
import { BookingRequest, JobStatus } from '../types';

interface DashboardProps {
  bookings: BookingRequest[];
  updateStatus: (id: string, status: JobStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, updateStatus }) => {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REQUESTED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case JobStatus.ON_PROGRESS: return 'bg-amber-100 text-amber-700 border-amber-200';
      case JobStatus.PENDING: return 'bg-rose-100 text-rose-700 border-rose-200';
      case JobStatus.CLOSE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REQUESTED: return <i className="fa-solid fa-clock-rotate-left"></i>;
      case JobStatus.ON_PROGRESS: return <i className="fa-solid fa-gear fa-spin"></i>;
      case JobStatus.PENDING: return <i className="fa-solid fa-triangle-exclamation"></i>;
      case JobStatus.CLOSE: return <i className="fa-solid fa-circle-check"></i>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[JobStatus.REQUESTED, JobStatus.ON_PROGRESS, JobStatus.PENDING, JobStatus.CLOSE].map(status => {
          const count = bookings.filter(b => b.status === status).length;
          return (
            <div key={status} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{status}</p>
                <p className="text-2xl font-bold text-slate-800">{count}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Transport Requests</h3>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Export Report</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Request ID</th>
                <th className="px-6 py-4 text-left">Unit Type</th>
                <th className="px-6 py-4 text-left">Schedule</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-700">{booking.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{booking.unit}</span>
                      <span className="text-xs text-slate-400 line-clamp-1">{booking.details}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-slate-700 font-medium">{booking.date}</span>
                      <span className="text-slate-400">{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center space-x-2 ${getStatusColor(booking.status)}`}>
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${booking.status === JobStatus.ON_PROGRESS ? 'bg-amber-400' : 'hidden'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          booking.status === JobStatus.REQUESTED ? 'bg-blue-500' :
                          booking.status === JobStatus.ON_PROGRESS ? 'bg-amber-500' :
                          booking.status === JobStatus.PENDING ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                      <span>{booking.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      value={booking.status}
                      onChange={(e) => updateStatus(booking.id, e.target.value as JobStatus)}
                      className="text-xs bg-slate-100 border-none rounded-lg p-2 font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.values(JobStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No active requests found. Create a new one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
