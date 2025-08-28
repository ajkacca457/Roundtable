import React, { useState, useEffect } from "react";
import AgentCard from "../components/AgentCard";
import { API_URL } from "../utils/env.js";


const AgentGenerator = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    tasks: "",
    goal: "",
    backstory: "",
  });

  // Fetch agents on mount
  useEffect(() => {
    fetch(`${API_URL}/agents`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch agents:", err);
        setLoading(false);
      });
  }, []);

  // Create new agent
  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name.trim()) return;

    const payload = {
      name: newAgent.name,
      description: newAgent.description,
      tasks: newAgent.tasks.split(",").map((t) => t.trim()),
      goal: newAgent.goal,
      backstory: newAgent.backstory,
    };

    try {
      const res = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload),
      });

      const createdAgent = await res.json();
      setAgents((prev) => [...prev, createdAgent]);
      setNewAgent({ name: "", description: "", tasks: "", goal: "", backstory: "" });
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  // Delete agent
  const handleDeleteAgent = async (id) => {
    try {
      await fetch(`${API_URL}/agents/${id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Management</h1>

      {/* Agent List */}
      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={handleDeleteAgent}
            />
          ))}
        </div>
      )}

      {/* Create New Agent Form */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Create New Agent</h2>
          <form onSubmit={handleAddAgent} className="space-y-4">
            <input
              type="text"
              placeholder="Agent Name"
              value={newAgent.name}
              onChange={(e) =>
                setNewAgent({ ...newAgent, name: e.target.value })
              }
              className="input input-bordered w-full"
              required
            />
            <textarea
              placeholder="Description"
              value={newAgent.description}
              onChange={(e) =>
                setNewAgent({ ...newAgent, description: e.target.value })
              }
              className="textarea textarea-bordered w-full"
            />
            <textarea
              placeholder="Goal"
              value={newAgent.goal}
              onChange={(e) =>
                setNewAgent({ ...newAgent, goal: e.target.value })
              }
              className="textarea textarea-bordered w-full"
            />
            <textarea
              placeholder="Backstory"
              value={newAgent.backstory}
              onChange={(e) =>
                setNewAgent({ ...newAgent, backstory: e.target.value })
              }
              className="textarea textarea-bordered w-full"
            />
            <input
              type="text"
              placeholder="Tasks (comma separated)"
              value={newAgent.tasks}
              onChange={(e) =>
                setNewAgent({ ...newAgent, tasks: e.target.value })
              }
              className="input input-bordered w-full"
            />
            <div className="flex justify-end">
              <button className="btn btn-success">Add Agent</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgentGenerator;
