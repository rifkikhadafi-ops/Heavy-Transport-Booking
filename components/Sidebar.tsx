
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat';
  setActiveTab: (tab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', icon: 'fa-solid fa-chart-column', label: 'Monitor' },
    { id: 'request', icon: 'fa-solid fa-plus-circle', label: 'Create Job' },
    { id: 'change-request', icon: 'fa-solid fa-shuffle', label: 'Modify' },
    { id: 'schedule', icon: 'fa-solid fa-timeline', label: 'Schedule' },
    { id: 'group-chat', icon: 'fa-brands fa-whatsapp', label: 'Ops Group', color: 'bg-emerald-600' }
  ];

  return (
    <>
      <aside className="hidden md:flex w-72 bg-slate-950 text-white flex-col py-8 shadow-2xl border-r border-slate-800">
        <div className="px-8 mb-12">
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 font-black shadow-lg shadow-amber-500/30 transform rotate-3">
              SCM
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none uppercase italic">Angber</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-1">LOGISTICS PRO</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                ? (item.id === 'group-chat' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/10') + ' text-white shadow-xl' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <i className={`${item.icon} w-6 text-center text-lg ${activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`}></i>
              <span className="ml-4 font-black text-[11px] uppercase tracking-wider text-left">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800/50 backdrop-blur-sm text-center">
            <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest text-center">Connected Device</p>
            <p className="text-[10px] font-bold text-emerald-500">+6282220454042</p>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center min-w-[64px] transition-all relative ${
              activeTab === item.id ? (item.id === 'group-chat' ? 'text-emerald-600' : 'text-blue-600') : 'text-slate-400'
            }`}
          >
            <div className={`text-xl mb-1 transition-transform ${activeTab === item.id ? 'scale-110 -translate-y-1' : ''}`}>
              <i className={item.icon}></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight text-center">
              {item.label}
            </span>
            {activeTab === item.id && (
              <div className={`absolute -bottom-3 w-1.5 h-1.5 rounded-full ${item.id === 'group-chat' ? 'bg-emerald-600' : 'bg-blue-600'}`}></div>
            )}
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
