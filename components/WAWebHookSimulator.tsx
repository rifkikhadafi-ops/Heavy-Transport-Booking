
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg flex items-center space-x-4">
        <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
          <i className="fa-brands fa-whatsapp"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">WhatsApp Bot Simulator</h2>
          <p className="text-emerald-100 text-sm">Test automated commands using message IDs from notifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <i className="fa-solid fa-paper-plane text-emerald-500"></i>
            <span>Send Command</span>
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase">Target Message ID</label>
              <select 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a message...</option>
                {notifications.map(n => (
                  <option key={n.id} value={n.id}>{n.id} ({n.requestId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase">Message Text</label>
              <input 
                type="text" 
                placeholder="Type /CLOSE or other commands..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button 
              onClick={handleSend}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/30"
            >
              Simulate WA Interaction
            </button>
            {lastFeedback && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-100 flex items-center space-x-2 animate-bounce">
                <i className="fa-solid fa-info-circle"></i>
                <span>{lastFeedback}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-100 p-6 rounded-3xl shadow-inner overflow-y-auto max-h-[500px]">
          <h3 className="font-bold text-slate-800 mb-4">Notification History</h3>
          <div className="space-y-4">
            {notifications.map(n => (
              <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-emerald-50 text-[10px] font-bold text-emerald-600 rounded-bl-xl border-l border-b border-emerald-100">
                  {n.id}
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <div className="flex-1 whitespace-pre-wrap text-sm text-slate-700 font-sans">
                    {n.content}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                  <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                  <span className="font-mono">{n.requestId}</span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic text-sm">
                No notifications sent yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WAWebHookSimulator;
