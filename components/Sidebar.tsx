
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat';
  setActiveTab: (tab: 'dashboard' | 'request' | 'change-request' | 'schedule' | 'group-chat') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Home' },
    { id: 'request', icon: 'fa-plus', label: 'New' },
    { id: 'schedule', icon: 'fa-calendar-days', label: 'Schedule' },
    { id: 'change-request', icon: 'fa-pen-to-square', label: 'Edit' },
    { id: 'group-chat', icon: 'fa-brands fa-whatsapp', label: 'Group', color: 'bg-emerald-600' }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col py-8 shadow-xl">
        <div className="px-6 mb-10 flex items-center space-x-3">
          <div className="h-10 px-2 min-w-[40px] bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/50 uppercase tracking-tighter">
            SCM
          </div>
          <span className="font-bold text-lg tracking-tight">SCM TRANSPORT</span>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? (item.id === 'group-chat' ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`${item.icon.includes('fa-') ? item.icon : 'fa-solid ' + item.icon} w-6 text-center`}></i>
              <span className="ml-3 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Registered System</p>
            <p className="text-sm font-semibold truncate">+622220454042</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center min-w-[64px] py-1 rounded-xl transition-all ${
              activeTab === item.id ? (item.id === 'group-chat' ? 'text-emerald-600' : 'text-blue-600') : 'text-slate-400'
            }`}
          >
            <div className={`text-lg mb-0.5 ${activeTab === item.id ? 'scale-110' : ''}`}>
              <i className={`${item.icon.includes('fa-') ? item.icon : 'fa-solid ' + item.icon}`}></i>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
