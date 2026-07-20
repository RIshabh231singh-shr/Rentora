import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Check, CheckCheck } from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, EmptyState, Avatar } from "../components/ui";

// Mock conversations for UI demonstration
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    name: "Raj Kumar",
    role: "Landlord",
    lastMsg: "Sure, I'll have someone check it tomorrow.",
    time: "2m",
    unread: 2,
    online: true,
    avatar: null,
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Tenant",
    lastMsg: "When is the rent due this month?",
    time: "1h",
    unread: 0,
    online: false,
    avatar: null,
  },
  {
    id: "3",
    name: "Ajay Singh",
    role: "Maintenance",
    lastMsg: "The pipe repair is complete.",
    time: "3h",
    unread: 0,
    online: true,
    avatar: null,
  },
  {
    id: "4",
    name: "Neha Patel",
    role: "Landlord",
    lastMsg: "Your lease has been renewed.",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: null,
  },
];

const MOCK_MESSAGES = {
  "1": [
    { id: "m1", from: "them", text: "Hi! How are things going at the property?", time: "10:00 AM", read: true },
    { id: "m2", from: "me", text: "Everything's good, but the kitchen pipe has a small leak.", time: "10:05 AM", read: true },
    { id: "m3", from: "them", text: "Oh, sorry to hear that! I'll arrange a plumber.", time: "10:08 AM", read: true },
    { id: "m4", from: "me", text: "Thank you so much!", time: "10:10 AM", read: true },
    { id: "m5", from: "them", text: "Sure, I'll have someone check it tomorrow.", time: "10:12 AM", read: false },
  ],
  "2": [
    { id: "m1", from: "them", text: "Hello! Quick question.", time: "9:00 AM", read: true },
    { id: "m2", from: "them", text: "When is the rent due this month?", time: "9:01 AM", read: true },
  ],
  "3": [
    { id: "m1", from: "them", text: "I've finished the repair work.", time: "Yesterday 4 PM", read: true },
    { id: "m2", from: "me", text: "Great! Thank you.", time: "Yesterday 4:05 PM", read: true },
    { id: "m3", from: "them", text: "The pipe repair is complete.", time: "Yesterday 4:10 PM", read: true },
  ],
  "4": [
    { id: "m1", from: "them", text: "Good news! Your lease has been renewed for another year.", time: "Yesterday 2 PM", read: true },
  ],
};

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState("1");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const selectedConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedId);
  const currentMessages = messages[selectedId] || [];

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: `m${Date.now()}`,
      from: "me",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), newMsg] }));
    setInput("");
    // Simulate typing response
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = { id: `mr${Date.now()}`, from: "them", text: "Got it! I'll get back to you shortly.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), read: false };
      setMessages(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), reply] }));
    }, 2000);
  };

  const filteredConvos = MOCK_CONVERSATIONS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout pageTitle="Messages">
      <div className="flex h-[calc(100vh-60px)]">

        {/* Sidebar */}
        <div className="w-72 lg:w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
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
            {filteredConvos.map(conv => (
              <motion.button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                whileHover={{ x: 2 }}
                className={`w-full flex items-center gap-3 p-4 text-left border-b border-slate-50 last:border-0 cursor-pointer border-none transition-colors ${selectedId === conv.id ? "bg-blue-50" : "bg-transparent hover:bg-slate-50"}`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.name} size="md" />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm ${conv.unread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{conv.name}</p>
                    <span className="text-[10px] text-slate-400">{conv.time}</span>
                  </div>
                  <p className={`text-xs truncate ${conv.unread ? "text-slate-900 font-medium" : "text-slate-500"}`}>{conv.lastMsg}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat header */}
            <div className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={selectedConversation.name} size="sm" />
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedConversation.name}</p>
                  <p className="text-[10px] text-slate-500">{selectedConversation.online ? "Online" : "Offline"} · {selectedConversation.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors">
                  <Phone className="size-4" />
                </button>
                <button className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors">
                  <Video className="size-4" />
                </button>
                <button className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors">
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {currentMessages.map((msg, i) => {
                const isMe = msg.from === "me";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <Avatar name={selectedConversation.name} size="sm" />
                    )}
                    <div className={`max-w-xs lg:max-w-sm xl:max-w-md`}>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? "chat-bubble-out" : "chat-bubble-in"}`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
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
              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex items-end gap-2"
                  >
                    <Avatar name={selectedConversation.name} size="sm" />
                    <div className="chat-bubble-in px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
