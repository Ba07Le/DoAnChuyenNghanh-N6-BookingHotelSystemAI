import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatWidget.css";
import { useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GREETING = "Xin chào! Mình có thể giúp bạn tìm khách sạn, phòng phù hợp và mã giảm giá. Bạn muốn đi đâu?";
const SUGGESTIONS = [
  "Khách sạn yên tĩnh gần biển",
  "Phòng rẻ nhất ở Đà Lạt cho 2 người",
  "Có mã giảm giá nào không?",
];

export default function ChatWidget() {
  const { pathname } = useLocation();
if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Bạn thử lại nhé." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Trợ lý AI</span>
            <button onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </div>

          <div className="chat-body">
            <div className="chat-msg bot">{GREETING}</div>

            {messages.length === 0 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === "user" ? "user" : "bot"}`}>
                {m.role === "user" ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
              </div>
            ))}

            {loading && <div className="chat-msg bot typing">Đang trả lời...</div>}
            <div ref={bottomRef} />
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>Gửi</button>
          </form>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Mở chat">
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}