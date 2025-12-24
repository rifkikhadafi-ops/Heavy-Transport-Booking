
import React, { useState, useRef, useEffect } from 'react';
import { WhatsAppNotification } from '../types';

interface LogisticsGroupChatProps {
  notifications: WhatsAppNotification[];
  onSendMessage: (text: string) => void;
}

const LogisticsGroupChat: React.FC<LogisticsGroupChatProps> = ({ notifications, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [notifications]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-[#e5ddd5] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-300 relative">
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center space-x-3 shadow-md z-10 border-b border-white/10">
        <i className="fa-solid fa-arrow-left text-lg md:hidden"></i>
        <div className="h-10 w-10 bg-emerald-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-500/30">
          <i className="fa-solid fa-helmet-safety text-white text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm md:text-base truncate tracking-tight">Ops Angkutan Berat SCM</h3>
          <p className="text-[10px] opacity-80 truncate font-medium">Group ID: 120363403134308128@g.us</p>
        </div>
        <div className="flex space-x-4 text-lg items-center">
          <i className="fa-solid fa-magnifying-glass opacity-60 text-sm"></i>
          <i className="fa-solid fa-ellipsis-vertical opacity-60 text-sm"></i>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pattern-whatsapp">
        <div className="flex justify-center mb-6">
          <div className="bg-white/80 backdrop-blur px-4 py-1 rounded-full shadow-sm border border-slate-200">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
               ENCRYPTED END-TO-END SCM SYSTEM
             </span>
          </div>
        </div>

        {notifications.slice().reverse().map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.isSystem ? 'items-start' : 'items-end'}`}
          >
            <div className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm relative border ${
              msg.isSystem 
              ? 'bg-white rounded-tl-none border-slate-100' 
              : 'bg-[#dcf8c6] rounded-tr-none border-[#c0e0b0]'
            }`}>
              {msg.isSystem && (
                <p className="text-[10px] font-black text-emerald-600 mb-0.5 flex items-center space-x-1">
                  <i className="fa-solid fa-bolt-lightning text-[8px]"></i>
                  <span>SCM SYSTEM (+62 822-2045-4042)</span>
                </p>
              )}
              <div className="text-sm text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">
                {msg.content}
              </div>
              <div className="flex justify-end items-center space-x-1 mt-1">
                <span className="text-[9px] text-slate-400 font-bold">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {!msg.isSystem && (
                  <i className="fa-solid fa-check-double text-[9px] text-blue-400"></i>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-[#f0f0f0] p-3 flex items-center space-x-2 border-t border-slate-200">
        <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center shadow-sm border border-slate-200">
          <i className="fa-regular fa-face-smile text-slate-400 text-xl mr-3 hover:text-emerald-600 cursor-pointer"></i>
          <input 
            type="text" 
            placeholder="Ketik perintah /CLOSE [ID] atau pesan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
          />
          <i className="fa-solid fa-paperclip text-slate-400 text-lg rotate-45 ml-2 hover:text-emerald-600 cursor-pointer"></i>
        </div>
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
            inputText.trim() ? 'bg-[#075e54] text-white scale-100' : 'bg-slate-300 text-slate-400 scale-95'
          } active:scale-90`}
        >
          <i className={`fa-solid ${inputText ? 'fa-paper-plane' : 'fa-microphone'} text-lg`}></i>
        </button>
      </form>

      <style>{`
        .pattern-whatsapp {
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
          background-attachment: fixed;
          background-size: 400px;
        }
      `}</style>
    </div>
  );
};

export default LogisticsGroupChat;
