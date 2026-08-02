import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Search, MoreVertical, Smile, Paperclip, Check, CheckCheck } from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, EmptyState, Avatar } from "../components/ui";
import api from "../utility/axiosInstance";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      const u = JSON.parse(s);
      setUser(u);
    }
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get("/messages/contacts");
      if (res.data.success) {
        setContacts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchMessages = async (contactId) => {
    try {
      const res = await api.get(`/messages/${contactId}`);
      if (res.data.success) {
        setMessages(prev => ({ ...prev, [contactId]: res.data.data }));
        
        // Mark messages from this contact as read locally
        setContacts(prev => prev.map(c => 
          c._id === contactId ? { ...c, unread: 0 } : c
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      
      // Notify server we read their messages
      if (window.socket) {
        window.socket.emit("mark_read", { sender: selectedId, receiver: user._id || user.id });
      }
    }
  }, [selectedId, user]);

  useEffect(() => {
    if (!window.socket) return;
    
    const handleNewMsg = (msg) => {
      // If it's for the currently open chat
      setMessages(prev => {
        const contactId = msg.sender === (user._id || user.id) ? msg.receiver : msg.sender;
        const current = prev[contactId] || [];
        // Prevent duplicate append if message already exists (from message_sent event)
        if (current.some(m => m._id === msg._id)) return prev;
        return { ...prev, [contactId]: [...current, msg] };
      });
      
      // If we received a message from someone else while not viewing their chat, increment unread
      if (msg.sender !== (user._id || user.id) && msg.sender !== selectedId) {
        setContacts(prev => prev.map(c => 
          c._id === msg.sender ? { ...c, unread: (c.unread || 0) + 1, lastMsg: msg.text, time: msg.createdAt } : c
        ));
      } else if (msg.sender !== (user._id || user.id)) {
        // We are viewing it, so mark read
        window.socket.emit("mark_read", { sender: msg.sender, receiver: user._id || user.id });
      }
    };
    
    const handleMsgSent = (msg) => {
      setMessages(prev => {
        const current = prev[msg.receiver] || [];
        if (current.some(m => m._id === msg._id)) return prev;
        return { ...prev, [msg.receiver]: [...current, msg] };
      });
    };
    
    const handleMsgsRead = (data) => {
      // The other person read our messages
      setMessages(prev => {
        const current = prev[data.reader] || [];
        return {
          ...prev,
          [data.reader]: current.map(m => m.sender === (user._id || user.id) ? { ...m, read: true } : m)
        };
      });
    };

    window.socket.on("new_message", handleNewMsg);
    window.socket.on("message_sent", handleMsgSent);
    window.socket.on("messages_read", handleMsgsRead);

    return () => {
      window.socket.off("new_message", handleNewMsg);
      window.socket.off("message_sent", handleMsgSent);
      window.socket.off("messages_read", handleMsgsRead);
    };
  }, [user, selectedId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedId]);

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return;
    const currentUserId = user?._id || user?.id;
    const textMsg = input.trim();
    setInput("");

    if (window.socket && window.socket.connected) {
      window.socket.emit("send_message", {
        sender: currentUserId,
        receiver: selectedId,
        text: textMsg
      });
    } else {
      try {
        const res = await api.post("/messages/send", {
          receiver: selectedId,
          text: textMsg
        });
        if (res.data.success) {
          setMessages(prev => {
            const current = prev[selectedId] || [];
            return { ...prev, [selectedId]: [...current, res.data.data] };
          });
        }
      } catch (err) {
        console.error("HTTP send message error:", err);
      }
    }
  };

  const selectedConversation = contacts.find(c => c._id === selectedId);
  const currentMessages = selectedId ? (messages[selectedId] || []) : [];

  const filteredConvos = contacts.filter(c =>
    !search || `${c.firstname} ${c.lastname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout pageTitle="Messages">
      <div className="flex h-[calc(100dvh-60px)] overflow-hidden">

        {/* Sidebar — hidden on mobile when chat is open */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 shrink-0 border-r border-slate-200 bg-white flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-lg mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                className="form-input pl-9 text-sm"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No conversations found. Note: You can only message landlords whose property you have booked (or tenants who have booked your properties).
              </div>
            ) : (
              filteredConvos.map(conv => (
                <motion.button
                  key={conv._id}
                  onClick={() => setSelectedId(conv._id)}
                  whileHover={{ x: 2 }}
                  className={`w-full flex items-center gap-3 p-4 text-left border-b border-slate-50 last:border-0 cursor-pointer border-none transition-colors ${selectedId === conv._id ? "bg-blue-50" : "bg-transparent hover:bg-slate-50"}`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={`${conv.firstname} ${conv.lastname}`} size="md" />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${conv.unread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                        {conv.firstname} {conv.lastname}
                      </p>
                      <span className="text-[10px] text-slate-400">{conv.time ? new Date(conv.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread ? "text-slate-900 font-medium" : "text-slate-500"}`}>{conv.lastMsg}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Chat area — full width on mobile when open */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
            {/* Chat header with mobile back button */}
            <div className="h-[60px] flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                {/* Back button - mobile only */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors mr-1"
                  aria-label="Back to conversations"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="relative">
                  <Avatar name={`${selectedConversation.firstname} ${selectedConversation.lastname}`} size="sm" />
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedConversation.firstname} {selectedConversation.lastname}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{selectedConversation.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors">
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {currentMessages.map((msg, i) => {
                const isMe = msg.sender === (user._id || user.id);
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <Avatar name={`${selectedConversation.firstname} ${selectedConversation.lastname}`} size="sm" />
                    )}
                    <div className={`max-w-xs lg:max-w-sm xl:max-w-md`}>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? "chat-bubble-out" : "chat-bubble-in"}`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && (
                          msg.read
                            ? <CheckCheck className="size-3 text-blue-500" />
                            : <Check className="size-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex items-center gap-3">
                <button className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer border-none transition-colors">
                  <Paperclip className="size-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    className="form-input pr-10"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                    <Smile className="size-4" />
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="size-10 rounded-xl flex items-center justify-center cursor-pointer border-none"
                  style={{ background: input.trim() ? "linear-gradient(135deg, #2563EB, #4F46E5)" : "#E2E8F0" }}
                >
                  <Send className={`size-4 ${input.trim() ? "text-white" : "text-slate-400"}`} />
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <EmptyState
              icon={<MessageSquare className="size-8" />}
              title="No conversation selected"
              description="Select a conversation from the sidebar to start messaging"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
