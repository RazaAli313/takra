import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MessageCircle, ArrowLeft } from "lucide-react";

const QUILL_SNOW_CSS = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css";

const AdminChat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatIdFromCreate, setChatIdFromCreate] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [quillCssReady, setQuillCssReady] = useState(false);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const adminId = import.meta.env.VITE_ADMIN_ID ?? null;
  const sidebarUsers = useQuery(
    api.chat.listChatUsersForAdmin,
    adminId ? { adminId } : "skip"
  ) ?? [];

  const chat = useQuery(
    api.chat.getChat,
    selectedUser && adminId
      ? { userId: selectedUser.id, adminId }
      : "skip"
  );
  const chatId = chat?._id ?? chatIdFromCreate;
  const getOrCreateChat = useMutation(api.chat.getOrCreateChat);
  const convexMessages = useQuery(
    api.chat.listMessages,
    chatId ? { chatId } : "skip"
  );
  const sendMessageMutation = useMutation(api.chat.sendMessage);

  useEffect(() => {
    if (selectedUser && adminId && chat === null && !creatingChat) {
      setCreatingChat(true);
      getOrCreateChat({
        userId: selectedUser.id,
        adminId,
      })
        .then((id) => setChatIdFromCreate(id))
        .finally(() => setCreatingChat(false));
    }
    if (!selectedUser) setChatIdFromCreate(null);
  }, [selectedUser, adminId, chat, creatingChat, getOrCreateChat]);

  const messages = (convexMessages ?? []).map((m) => ({
    id: m._id,
    sender: m.senderId === adminId ? "response" : "user",
    content: m.content,
    timestamp: new Date(m._creationTime).toISOString(),
  }));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const existing = document.getElementById("quill-snow-css");
    if (existing) {
      setQuillCssReady(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = QUILL_SNOW_CSS;
    link.id = "quill-snow-css";
    link.onload = () => setQuillCssReady(true);
    link.onerror = () => setQuillCssReady(true);
    document.head.appendChild(link);
    return () => {
      const el = document.getElementById("quill-snow-css");
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !quillCssReady || !selectedUser) return;
    let quill = null;
    const initQuill = async () => {
      try {
        const Quill = (await import("quill")).default;
        const container = editorRef.current;
        if (!container || quillInstanceRef.current) return;
        quill = new Quill(container, {
          theme: "snow",
          placeholder: "Type a message...",
          modules: {
            toolbar: [
              ["bold", "italic", "underline"],
              ["link", "image"],
              [{ list: "ordered" }, { list: "bullet" }],
            ],
            uploader: {
              mimetypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
              handler: (range, files) => {
                const promises = files.map(
                  (file) =>
                    new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.readAsDataURL(file);
                    })
                );
                Promise.all(promises).then((images) => {
                  const Delta = Quill.import("delta");
                  let update = new Delta().retain(range.index).delete(range.length);
                  images.forEach((image) => (update = update.insert({ image })));
                  quill.updateContents(update, Quill.sources.USER);
                  quill.setSelection(range.index + images.length, Quill.sources.SILENT);
                });
              },
            },
          },
        });
        quillInstanceRef.current = quill;
        setIsQuillReady(true);
      } catch (err) {
        console.error("Quill init:", err);
      }
    };
    initQuill();
    return () => {
      quillInstanceRef.current = null;
      setIsQuillReady(false);
    };
  }, [quillCssReady, selectedUser]);

  const handleSend = async () => {
    const quill = quillInstanceRef.current;
    if (!quill || !chatId || !adminId) return;
    const html = quill.root.innerHTML;
    const text = quill.getText().trim();
    if (!text && !html.includes("<img")) return;
    try {
      await sendMessageMutation({
        chatId,
        senderId: adminId,
        content: html,
      });
      const len = quill.getLength();
      if (len > 1) quill.deleteText(0, len - 1);
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-white">
      {/* Left sidebar - WhatsApp style */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-[#111b21] border-r border-gray-700">
        <div className="p-4 bg-[#202c33]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-emerald-400" />
            Chats
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!adminId ? (
            <div className="p-4 text-gray-400 text-sm">Set VITE_ADMIN_ID in .env to see chats.</div>
          ) : sidebarUsers === undefined ? (
            <div className="p-4 text-gray-400 text-sm">Loading users...</div>
          ) : (
            sidebarUsers.map((user) => (
              <motion.button
                key={user.id}
                type="button"
                whileHover={{ backgroundColor: "#2a3942" }}
                whileTap={{ scale: 0.99 }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-700/50 ${
                  selectedUser?.id === user.id ? "bg-[#2a3942]" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(user.name || user.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.name || user.email || user.id}</p>
                  <p className="text-gray-400 text-sm truncate">{user.email || "No email"}</p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right - Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b141a]">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
            <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
              <MessageCircle className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-300">Select a chat</p>
            <p className="text-sm mt-1">Choose a user from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] border-b border-gray-700">
              <button
                type="button"
                className="md:hidden p-2 rounded-full hover:bg-gray-600 text-white"
                onClick={() => setSelectedUser(null)}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                {(selectedUser.name || selectedUser.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{selectedUser.name || selectedUser.email || selectedUser.id}</p>
                <p className="text-gray-400 text-xs truncate">{selectedUser.email || selectedUser.id}</p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]"
            >
              {creatingChat && !chatId && (
                <p className="text-gray-400 text-sm text-center">Loading conversation...</p>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "user"
                        ? "bg-[#202c33] text-white rounded-bl-md"
                        : "bg-[#005c4b] text-white rounded-br-md"
                    }`}
                  >
                    <div
                      className="prose prose-invert prose-sm max-w-none break-words prose-p:my-1 prose-p:text-gray-100 prose-img:rounded-lg prose-img:max-h-48"
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                    />
                    <p className="text-xs opacity-80 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quill composer */}
            <div className="quill-admin-chat flex-shrink-0 border-t border-gray-700 bg-[#202c33] p-2">
              <div className="relative rounded-lg bg-white overflow-visible">
                <div ref={editorRef} className="min-h-[48px] bg-white" style={{ border: "none" }} />
                <div className="absolute bottom-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!isQuillReady || !chatId || !adminId}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#005c4b] text-white hover:bg-[#056d5a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .quill-admin-chat .ql-toolbar.ql-snow { background: #f0f2f5; border-color: #e0e0e0; }
        .quill-admin-chat .ql-container.ql-snow { border-color: #e0e0e0; }
        .quill-admin-chat .ql-editor { min-height: 44px; padding-right: 70px; color: #111; }
        .quill-admin-chat .ql-snow .ql-stroke { stroke: #999; }
        .quill-admin-chat .ql-snow .ql-fill { fill: #005c4b; }
      `}</style>
    </div>
  );
};

export default AdminChat;
