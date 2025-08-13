import React, { useState } from "react";

const AgentGenerator = () => {
  // Mock data for agents
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Growth Coach",
      description: "Helps with personal and professional growth strategies.",
      tasks: ["Weekly progress review", "Goal setting", "Motivation tips"],
    },
    {
      id: 2,
      name: "Research Assistant",
      description: "Finds and summarizes information for projects.",
      tasks: ["Market research", "Competitor analysis", "Summarizing reports"],
    },
  ]);

  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    tasks: "",
  });

  const handleAddAgent = (e) => {
    e.preventDefault();
    if (!newAgent.name.trim()) return;

    setAgents([
      ...agents,
      {
        id: Date.now(),
        name: newAgent.name,
        description: newAgent.description,
        tasks: newAgent.tasks.split(",").map((t) => t.trim()),
      },
    ]);

    setNewAgent({ name: "", description: "", tasks: "" });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Management</h1>

      {/* Agent List */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {agents.map((agent) => (
          <div key={agent.id} className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title">{agent.name}</h2>
              <p className="text-sm text-gray-500">{agent.description}</p>
              <ul className="mt-2 list-disc list-inside text-sm">
                {agent.tasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
              <div className="card-actions justify-end mt-4">
                <a
                  href={`/chat/${agent.id}`}
                  className="btn btn-primary btn-sm"
                >
                  Chat
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Agent Form */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Create New Agent</h2>
          <form onSubmit={handleAddAgent} className="space-y-4">
            <input
              type="text"
              placeholder="Agent Name"
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
            <input
              type="text"
              placeholder="Tasks (comma separated)"
              value={newAgent.tasks}
              onChange={(e) => setNewAgent({ ...newAgent, tasks: e.target.value })}
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
