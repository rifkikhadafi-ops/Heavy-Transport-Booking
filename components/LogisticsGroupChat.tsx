
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
    <div className="max-w-2xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-[#e5ddd5] rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-300 relative">
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center space-x-3 shadow-md z-10">
        <i className="fa-solid fa-arrow-left text-lg md:hidden"></i>
        <div className="h-10 w-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
          <i className="fa-solid fa-users text-white text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm md:text-base truncate tracking-tight">Model Angber</h3>
          <p className="text-[10px] opacity-80 truncate">Online: +6282220454042, Admin, User...</p>
        </div>
        <div className="flex space-x-4 text-lg">
          <i className="fa-solid fa-video opacity-60"></i>
          <i className="fa-solid fa-phone opacity-60"></i>
          <i className="fa-solid fa-ellipsis-vertical opacity-60"></i>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pattern-whatsapp">
        <div className="flex justify-center mb-4">
          <span className="bg-[#dcf8c6] text-[10px] font-bold py-1 px-3 rounded-lg shadow-sm uppercase tracking-widest text-slate-600">
            Today
          </span>
        </div>

        {notifications.slice().reverse().map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.isSystem ? 'items-start' : 'items-end'}`}
          >
            <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm relative ${
              msg.isSystem ? 'bg-white rounded-tl-none' : 'bg-[#dcf8c6] rounded-tr-none'
            }`}>
              {msg.isSystem && (
                <p className="text-[10px] font-black text-emerald-600 mb-0.5">+62 822-2045-4042</p>
              )}
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
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
      <form onSubmit={handleSend} className="bg-[#f0f0f0] p-2 flex items-center space-x-2">
        <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center shadow-sm border border-slate-200">
          <i className="fa-regular fa-face-smile text-slate-400 text-xl mr-3"></i>
          <input 
            type="text" 
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
          />
          <i className="fa-solid fa-paperclip text-slate-400 text-lg rotate-45 ml-2"></i>
          <i className="fa-solid fa-camera text-slate-400 text-lg ml-3"></i>
        </div>
        <button 
          type="submit"
          className="h-11 w-11 bg-[#075e54] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <i className={`fa-solid ${inputText ? 'fa-paper-plane' : 'fa-microphone'} text-lg`}></i>
        </button>
      </form>

      <style>{`
        .pattern-whatsapp {
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};

export default LogisticsGroupChat;
