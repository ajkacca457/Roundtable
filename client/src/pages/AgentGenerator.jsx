import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AgentCard from "../components/AgentCard";
import { API_URL } from "../utils/env.js";

const AgentGenerator = () => {
  const { boardId } = useParams();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    tasks: "",
    goal: "",
    backstory: "",
    expected_output: "",
  });

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/agents?board_id=${boardId}`);
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [boardId]);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name.trim()) return;

    const payload = {
      board_id: Number(boardId),
      name: newAgent.name,
      description: newAgent.description,
      tasks: newAgent.tasks.split(",").map((t) => t.trim()).filter(Boolean),
      goal: newAgent.goal,
      backstory: newAgent.backstory,
      expected_output: newAgent.expected_output,
    };

    try {
      const res = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createdAgent = await res.json();
      setAgents((prev) => [...prev, createdAgent]);
      setNewAgent({
        name: "",
        description: "",
        tasks: "",
        goal: "",
        backstory: "",
        expected_output: "",
      });
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  const handleDeleteAgent = async (id) => {
    try {
      await fetch(`${API_URL}/agents/${id}`, { method: "DELETE" });
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-base-content mb-6">Advisors on this board</h1>

      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDelete={handleDeleteAgent} />
          ))}
        </div>
      )}

      <div className="bg-base-100 border border-base-300 rounded p-6">
        <h2 className="font-display text-lg mb-4">Add a new advisor</h2>
        <form onSubmit={handleAddAgent} className="space-y-4">
          <input
            type="text"
            placeholder="Advisor name (e.g. Head Coach)"
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
            className="input input-bordered w-full"
            required
          />
          <textarea
            placeholder="Description"
            value={newAgent.description}
            onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
            className="textarea textarea-bordered w-full"
          />
          <textarea
            placeholder="Goal"
            value={newAgent.goal}
            onChange={(e) => setNewAgent({ ...newAgent, goal: e.target.value })}
            className="textarea textarea-bordered w-full"
          />
          <textarea
            placeholder="Backstory"
            value={newAgent.backstory}
            onChange={(e) => setNewAgent({ ...newAgent, backstory: e.target.value })}
            className="textarea textarea-bordered w-full"
          />
          <textarea
            placeholder="Expected output / custom prompt"
            value={newAgent.expected_output}
            onChange={(e) => setNewAgent({ ...newAgent, expected_output: e.target.value })}
            className="textarea textarea-bordered w-full"
          />
          <input
            type="text"
            placeholder="Tasks (comma separated)"
            value={newAgent.tasks}
            onChange={(e) => setNewAgent({ ...newAgent, tasks: e.target.value })}
            className="input input-bordered w-full"
          />
          <div className="flex justify-end">
            <button className="btn btn-primary">Add advisor</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentGenerator;