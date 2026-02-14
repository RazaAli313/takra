import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const QUILL_SNOW_CSS = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css";

// Fake IDs until you wire FastAPI user/admin ids
const FAKE_USER_ID = "user-1";
const FAKE_ADMIN_ID = "admin-1";

const ChatAdmin = () => {
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [chatIdFromCreate, setChatIdFromCreate] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [quillCssReady, setQuillCssReady] = useState(false);

  const chat = useQuery(api.chat.getChat, {
    userId: FAKE_USER_ID,
    adminId: FAKE_ADMIN_ID,
  });
  const getOrCreateChat = useMutation(api.chat.getOrCreateChat);
  const chatId = chat?._id ?? chatIdFromCreate;
  const convexMessages = useQuery(
    api.chat.listMessages,
    chatId ? { chatId } : "skip"
  );
  const sendMessageMutation = useMutation(api.chat.sendMessage);

  useEffect(() => {
    if (chat === null && !creatingChat) {
      setCreatingChat(true);
      getOrCreateChat({ userId: FAKE_USER_ID, adminId: FAKE_ADMIN_ID })
        .then((id) => setChatIdFromCreate(id))
        .finally(() => setCreatingChat(false));
    }
  }, [chat, creatingChat, getOrCreateChat]);

  const messages = (convexMessages ?? []).map((m) => ({
    id: m._id,
    sender: m.senderId === FAKE_USER_ID ? "user" : "response",
    content: m.content,
    timestamp: new Date(m._creationTime).toISOString(),
  }));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load Quill snow theme CSS first; init Quill only after CSS loads so toolbar renders
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

  // On page load / navigate: scroll messages to bottom
  useEffect(() => {
    const scrollToBottomOnMount = () => {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    };
    scrollToBottomOnMount();
    const t = setTimeout(scrollToBottomOnMount, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!editorRef.current || !quillCssReady) return;

    let quill = null;

    const initQuill = async () => {
      try {
        const Quill = (await import("quill")).default;
        const container = editorRef.current;
        if (!container || quillInstanceRef.current) return;

        const toolbarOptions = [
          ["bold", "italic", "underline"],
          ["link", "image"],
          [{ list: "ordered" }, { list: "bullet" }],
        ];

        quill = new Quill(container, {
          theme: "snow",
          placeholder: "Type your message...",
          modules: {
            toolbar: toolbarOptions,
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
                  images.forEach((image) => {
                    update = update.insert({ image });
                  });
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
        console.error("Failed to load Quill:", err);
      }
    };

    initQuill();
    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
        setIsQuillReady(false);
      }
    };
  }, [quillCssReady]);

  const handleSend = async () => {
    const quill = quillInstanceRef.current;
    if (!quill) return;

    const root = quill.root;
    const html = root.innerHTML;
    const text = quill.getText().trim();
    if (!text && !html.includes("<img")) return;

    if (!chatId) return;

    try {
      await sendMessageMutation({
        chatId,
        senderId: FAKE_USER_ID,
        content: html,
      });
      const len = quill.getLength();
      if (len > 1) quill.deleteText(0, len - 1);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="fixed inset-0 top-20 z-0 flex flex-col w-full bg-gradient-to-b from-white via-sky-50/30 to-slate-50 text-slate-800">
      <div className="flex flex-col flex-1 w-full min-h-0 p-4 md:p-6">
        {/* Messages area - takes remaining space */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-white/90 border border-sky-200/80 shadow-sm shadow-sky-100 p-4 space-y-4 mb-4"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.sender === "user"
                    ? "bg-sky-50 border border-sky-200/80 text-slate-800 text-left rounded-bl-md"
                    : "bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-200/60 text-slate-800 text-left rounded-br-md"
                }`}
              >
                <div
                  className="prose prose-slate prose-sm max-w-none break-words
                    prose-p:my-1 prose-p:text-slate-700 prose-img:rounded-lg prose-img:max-h-48"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quill editor - toolbar + editor; Send button inside editor area (bottom-right) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="quill-chat-wrapper relative flex-shrink-0 rounded-xl border border-sky-200/80 bg-white shadow-sm shadow-sky-100 overflow-visible"
        >
          <div
            ref={editorRef}
            className="min-h-[52px] bg-white"
            style={{ border: "none" }}
          />
          <div className="absolute bottom-2 right-14 z-10">
            <button
              type="button"
              onClick={handleSend}
              disabled={!isQuillReady || !chatId}
              className="px-3 py-1.5 rounded-md text-lg font-medium bg-gradient-to-r from-sky-500 to-blue-500 text-white
                hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm"
            >
              Send
            </button>
          </div>
        </motion.div>

        <p className="flex-shrink-0 text-slate-500 text-xs mt-2 text-center">
          Use the toolbar to format text, add links, or upload images (paste or
          use the image button).
        </p>
      </div>

      {/* Override Quill snow theme to snowy blue */}
      <style>{`
        .quill-chat-wrapper.ql-container.ql-snow,
        .quill-chat-wrapper .ql-toolbar.ql-snow {
          border-color: #e0f2fe;
        }
        .quill-chat-wrapper .ql-toolbar.ql-snow {
          background: #f8fafc;
          border-bottom: 1px solid #e0f2fe;
        }
        .quill-chat-wrapper .ql-container.ql-snow {
          font-size: 1rem;
        }
        .quill-chat-wrapper .ql-editor {
          min-height: 36px;
          max-height: 80px;
          color: #1e293b;
          padding-right: 72px;
        }
        .quill-chat-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
        }
        .quill-chat-wrapper .ql-snow .ql-stroke {
          stroke: #7dd3fc;
        }
        .quill-chat-wrapper .ql-snow .ql-fill {
          fill: #0ea5e9;
        }
      `}</style>
    </div>
  );
};

export default ChatAdmin;
