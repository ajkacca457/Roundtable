import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const AgentChat = () => {
  const { id } = useParams(); // Agent ID from URL

  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch agent info
  useEffect(() => {
    fetch(`${API_URL}/agents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setAgent(data);
        setMessages([
          {
            sender: "agent",
            text: `Hello! I'm ${data.name}, how can I help you?`,
            source_percent: { internal: 100, internet: 0 }, // default
          },
        ]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load agent:", err);
        setLoading(false);
      });
  }, [id]);

  // Scroll when messages change
  useEffect(scrollToBottom, [messages]);

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch(`${API_URL}/agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: data.reply,
          source_percent: data.source_percent || { internal: 100, internet: 0 },
        },
      ]);
    } catch (err) {
      console.error("Error chatting with agent:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "Sorry, something went wrong.", source_percent: { internal: 0, internet: 0 } },
      ]);
    }
  };

  if (loading) return <p className="p-4">Loading agent...</p>;
  if (!agent) return <p className="p-4 text-red-500">Agent not found.</p>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-base-200">
      {/* Header */}
      <div className="p-4 shadow bg-base-100 flex items-center justify-between">
        <h2 className="text-xl font-bold">{agent.name} — Chat</h2>
        <span className="badge badge-success">Online</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"
              }`}
            >
              <div className="flex justify-between items-start">
                <span>{msg.text}</span>
                {msg.sender === "agent" && msg.source_percent && (
                  <span className="ml-2 text-xs text-white bg-blue-600 rounded-2xl px-2 py-2">
                    {`Internal: ${msg.source_percent.internal}% | Internet: ${msg.source_percent.internet}%`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-base-100 border-t border-base-300 flex gap-2 sticky bottom-0">
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
