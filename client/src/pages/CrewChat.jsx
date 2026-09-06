import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../utils/env.js";

const CrewChatPage = () => {
  const { boardId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/boards/${boardId}/history`);
        const data = await res.json();
        const parsed = data.history.map((entry) => {
          const [sender, ...rest] = entry.split(": ");
          return { sender, text: rest.join(": ") };
        });
        setMessages(parsed);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    loadHistory();
  }, [boardId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: "User", text: userText }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();

      // Skip index 0 — it's the User echo we already added optimistically above
      setMessages((prev) => [...prev, ...data.messages.slice(1)]);
    } catch (err) {
      console.error("Crew chat error:", err);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === "User";
          const isSynthesis = msg.sender === "Synthesis";
          return (
            <div key={idx} className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
              <div className="chat-header text-xs opacity-60 mb-1">{msg.sender}</div>
              <div
                className={`chat-bubble whitespace-pre-wrap ${
                  isUser
                    ? "chat-bubble-primary"
                    : isSynthesis
                    ? "bg-accent text-accent-content border-2 border-accent"
                    : "bg-base-100 border border-base-300 text-base-content"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-100 border border-base-300 text-base-content/60">
              The board is discussing...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-base-100 border-t border-base-300 flex gap-2">
        <input
          type="text"
          placeholder="Ask the board, or @AgentName for one advisor..."
          className="input input-bordered flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={sending}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={sending}>
          Send
        </button>
        <button className="btn btn-ghost" onClick={clearChat}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default CrewChatPage;