
import React, { useState } from 'react';
import { WhatsAppNotification } from '../types';

interface WAWebHookSimulatorProps {
  notifications: WhatsAppNotification[];
  onSendCommand: (command: string, msgId: string) => string;
}

const WAWebHookSimulator: React.FC<WAWebHookSimulatorProps> = ({ notifications, onSendCommand }) => {
  const [command, setCommand] = useState('');
  const [targetId, setTargetId] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const handleSend = () => {
    if (!command || !targetId) return;
    const feedback = onSendCommand(command, targetId);
    setLastFeedback(feedback);
    setCommand('');
    setTimeout(() => setLastFeedback(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="bg-emerald-600 text-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-lg flex items-center space-x-4">
        <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 rounded-full flex items-center justify-center text-xl md:text-2xl">
          <i className="fa-brands fa-whatsapp"></i>
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">WA Bot Simulator</h2>
          <p className="text-emerald-100 text-[10px] md:text-sm font-medium">Auto-process /CLOSE command via Message ID.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 order-2 md:order-1">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2 text-sm md:text-base">
            <i className="fa-solid fa-paper-plane text-emerald-500"></i>
            <span>Run Command</span>
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message ID</label>
              <select 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
              >
                <option value="">Select ID...</option>
                {notifications.map(n => (
                  <option key={n.id} value={n.id}>{n.id} ({n.requestId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Command Text</label>
              <input 
                type="text" 
                placeholder="Type /CLOSE..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
              />
            </div>
            <button 
              onClick={handleSend}
              className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-500/20 text-xs uppercase"
            >
              Simulate Send
            </button>
            {lastFeedback && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-100 flex items-center space-x-2 animate-pulse uppercase">
                <i className="fa-solid fa-info-circle"></i>
                <span>{lastFeedback}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-100 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-inner overflow-y-auto max-h-[400px] md:max-h-[500px] order-1 md:order-2">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-tight">Notification History</h3>
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
                <div className="absolute top-0 right-0 p-1.5 bg-emerald-50 text-[8px] font-black text-emerald-600 rounded-bl-lg border-l border-b border-emerald-100">
                  {n.id}
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <div className="flex-1 whitespace-pre-wrap text-[11px] text-slate-700 font-sans leading-relaxed">
                    {n.content}
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-slate-400 flex justify-between font-bold">
                  <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                  <span className="font-mono text-blue-500">{n.requestId}</span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic text-xs font-bold uppercase">
                No history.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WAWebHookSimulator;
