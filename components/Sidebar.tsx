
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'request' | 'change-request' | 'schedule';
  setActiveTab: (tab: 'dashboard' | 'request' | 'change-request' | 'schedule') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', icon: 'fa-solid fa-list-check', label: 'Monitor' },
    { id: 'request', icon: 'fa-solid fa-plus', label: 'Booking' },
    { id: 'change-request', icon: 'fa-solid fa-edit', label: 'Ubah Data' },
    { id: 'schedule', icon: 'fa-solid fa-calendar-day', label: 'Timeline' }
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col py-8 shadow-2xl">
        <div className="px-8 mb-12">
          <div className="h-10 w-24 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900 font-black text-xl italic shadow-lg shadow-amber-500/20">
            SCM
          </div>
          <p className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-widest">Heavy Transport System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center p-4 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`${item.icon} w-6 text-center text-lg`}></i>
              <span className="ml-4 font-bold text-[11px] uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 py-4">
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Target Group</p>
              <p className="text-[9px] font-mono text-slate-400 break-all leading-tight">120363403134308128@g.us</p>
           </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50 shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center px-4 transition-all ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <i className={`${item.icon} text-xl mb-1`}></i>
            <span className="text-[8px] font-black uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
