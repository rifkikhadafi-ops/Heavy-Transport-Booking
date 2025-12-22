
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'simulator';
  setActiveTab: (tab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'simulator') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col items-center md:items-stretch py-8 shadow-xl">
      <div className="px-6 mb-10 flex items-center space-x-3">
        <div className="h-10 px-2 min-w-[40px] bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/50 uppercase tracking-tighter">
          SCM
        </div>
        <span className="hidden md:block font-bold text-lg tracking-tight">SCM TRANSPORT</span>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-chart-line w-6 text-center"></i>
          <span className="hidden md:block ml-3 font-medium">Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('request')}
          className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'request' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-plus w-6 text-center"></i>
          <span className="hidden md:block ml-3 font-medium">New Booking</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')}
          className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-calendar-days w-6 text-center"></i>
          <span className="hidden md:block ml-3 font-medium">Schedule</span>
        </button>

        <button 
          onClick={() => setActiveTab('change-request')}
          className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'change-request' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <i className="fa-solid fa-pen-to-square w-6 text-center"></i>
          <span className="hidden md:block ml-3 font-medium">Change Request</span>
        </button>

        <div className="pt-4 mt-4 border-t border-slate-800">
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'simulator' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <i className="fa-brands fa-whatsapp w-6 text-center"></i>
            <span className="hidden md:block ml-3 font-medium">WA Simulator</span>
          </button>
        </div>
      </nav>

      <div className="p-6 hidden md:block">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-xs text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm font-semibold truncate">SCM Supervisor</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
