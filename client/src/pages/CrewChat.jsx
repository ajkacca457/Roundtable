import React, { useState } from "react";
import { API_URL } from "../utils/env.js";
import { v4 as uuidv4 } from "uuid"; // For generating session ID

const CrewChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null); // Track current session

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message locally
    setMessages((prev) => [...prev, { sender: "You", text: input }]);

    try {
      const res = await fetch(`${API_URL}/crew-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({
          message: input,
          session_id: sessionId, // Send session ID to backend
        }),
      });

      const data = await res.json();
      console.log("Crew chat response:", data);

      // Update sessionId if backend returns a new one
      if (!sessionId) setSessionId(data.session_id);

      // Replace messages with full conversation from backend
      setMessages(data.messages);

      setInput("");
    } catch (err) {
      console.error("Crew chat error:", err);
    }
  };

  const clearSession = () => {
    setMessages([]);
    setInput("");
    setSessionId(null); // Reset session
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-base-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${msg.sender === "You" ? "chat-end" : "chat-start"}`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "You"
                  ? "chat-bubble-primary"
                  : "chat-bubble-secondary"
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-base-100 border-t border-base-300 flex gap-2">
        <input
          type="text"
          placeholder="Send message to the crew..."
          className="input input-bordered flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
        <button className="btn btn-secondary" onClick={clearSession}>
          Clear Session
        </button>
      </div>
    </div>
  );
};

export default CrewChatPage;
