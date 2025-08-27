import React, { useState, useEffect } from "react";

const API_URL = "https://284dd58383a3.ngrok-free.app";
// const API_URL = "http://127.0.0.1:8000";

const Dashboard = () => {
  const [agents, setAgents] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agentsRes = await fetch(`${API_URL}/agents`, {
          headers: { "ngrok-skip-browser-warning": "1" },
        });
        const agentsData = await agentsRes.json();

        const kbRes = await fetch(`${API_URL}/knowledge`, {
          headers: { "ngrok-skip-browser-warning": "1" },
        });
        const kbData = await kbRes.json();

        setAgents(agentsData);
        setKnowledge(kbData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Total Agents</div>
          <div className="stat-value text-primary">{agents.length}</div>
        </div>

        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Total Tasks</div>
          <div className="stat-value text-secondary">
            {agents.reduce((sum, a) => sum + (a.tasks?.length || 0), 0)}
          </div>
        </div>

        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Knowledge Items</div>
          <div className="stat-value text-accent">{knowledge.length}</div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Agents Overview</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tasks Assigned</th>
                <th>Goal</th>
                <th>Backstory</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.name}</td>
                  <td>{agent.tasks?.length || 0}</td>
                  <td>{agent.goal || "-"}</td>
                  <td>{agent.backstory || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
