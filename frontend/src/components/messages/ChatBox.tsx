import React, { useState } from 'react';
import { useMessages } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Search, Phone, Video, Paperclip, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export const ChatBox: React.FC = () => {
  const { user } = useAuth();
  const { threads, messages, activeThreadId, setActiveThreadId, sendMessage } = useMessages();
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMessages = messages.filter((m) => m.threadId === activeThread?.id);

  const filteredThreads = threads.filter((t) => {
    const titleName = user.role === 'PARENT' ? t.therapistName : t.parentName;
    return titleName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;

    const recipientId = user.role === 'PARENT' ? activeThread.therapistId : activeThread.parentId;
    sendMessage(activeThread.id, user.id, user.name, user.role as any, recipientId, text.trim());
    setText('');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col md:flex-row h-[620px] shadow-sm">
      {/* Left Sidebar: Conversations List */}
      <div className="w-full md:w-80 border-r border-slate-100 bg-slate-50/40 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Conversations</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-100 text-slate-800 rounded-xl border border-slate-200/60 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">No active conversations.</div>
          ) : (
            filteredThreads.map((t) => {
              const isSelected = t.id === activeThread?.id;
              const titleName = user.role === 'PARENT' ? t.therapistName : t.parentName;

              return (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={clsx(
                    'p-3.5 transition-colors cursor-pointer flex items-center gap-3',
                    isSelected ? 'bg-purple-50/80 border-l-4 border-l-purple-600' : 'hover:bg-slate-100/50'
                  )}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                      {titleName.charAt(0)}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">{titleName}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {t.lastMessageTimestamp
                          ? new Date(t.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {t.lastMessageText || 'Tap to view conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeThread ? (
          <>
            {/* Top Bar Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center border border-purple-200">
                    {user.role === 'PARENT' ? activeThread.therapistName.charAt(0) : activeThread.parentName.charAt(0)}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{user.role === 'PARENT' ? activeThread.therapistName : activeThread.parentName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  </h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
              {activeMessages.map((m) => {
                const isMe = m.senderId === user.id;

                return (
                  <div key={m.id} className={clsx('flex flex-col max-w-[75%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
                    <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                      {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={clsx(
                        'p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs font-medium',
                        isMe
                          ? 'bg-purple-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-xs'
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white">
              <button type="button" className="p-2.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer">
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-purple-600 bg-slate-50"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer shadow-md shadow-purple-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-semibold">
            Select a conversation thread to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};
