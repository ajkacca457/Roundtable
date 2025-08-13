import React, { useState } from "react";
import { useParams } from "react-router-dom";

const AgentChat = () => {
  const { name } = useParams(); // Get agent name from URL
  const [messages, setMessages] = useState([
    { sender: "agent", text: `Hello! I'm ${name}, here to help you.` },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);

    // Simulate agent reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "Got it! Let me work on that for you." },
      ]);
    }, 800);

    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-base-200">
      {/* Header */}
      <div className="p-4 shadow bg-base-100 flex items-center justify-between">
        <h2 className="text-xl font-bold">{name} — Chat</h2>
        <span className="badge badge-success">Online</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${
              msg.sender === "user" ? "chat-end" : "chat-start"
            }`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "user"
                  ? "chat-bubble-primary"
                  : "chat-bubble-secondary"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-base-100 border-t border-base-300 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="input input-bordered flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AgentChat;
