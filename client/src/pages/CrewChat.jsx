import React, { useState } from "react";

const CrewChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "You", text: input }]);

    const API_URL = "https://284dd58383a3.ngrok-free.app";
    // const API_URL = "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${API_URL}/crew-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1", // <-- Added header
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, ...data.messages]);
      setInput("");
    } catch (err) {
      console.error("Crew chat error:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-base-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${
              msg.sender === "You" ? "chat-end" : "chat-start"
            }`}
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
      </div>
    </div>
  );
};

export default CrewChatPage;
