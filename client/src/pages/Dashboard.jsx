import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApiFetch } from "../hooks/useApiFetch";

const Dashboard = () => {
  const { boardId } = useParams();
  const [agents, setAgents] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiFetch, isLoaded, isSignedIn } = useApiFetch();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchData = async () => {
      try {
        const agentsRes = await apiFetch(`/agents?board_id=${boardId}`);
        const agentsData = await agentsRes.json();

        const kbRes = await apiFetch(`/knowledge?board_id=${boardId}`);
        const kbData = await kbRes.json();

        setAgents(agentsData);
        setKnowledge(kbData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [boardId, isLoaded, isSignedIn]);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat bg-base-100 border border-base-300 rounded p-4">
          <div className="stat-title text-base-content/60">Total Agents</div>
          <div className="stat-value text-primary">{agents.length}</div>
        </div>

        <div className="stat bg-base-100 border border-base-300 rounded p-4">
          <div className="stat-title text-base-content/60">Total Tasks</div>
          <div className="stat-value text-accent">
            {agents.reduce((sum, a) => sum + (a.tasks?.length || 0), 0)}
          </div>
        </div>

        <div className="stat bg-base-100 border border-base-300 rounded p-4">
          <div className="stat-title text-base-content/60">Knowledge Items</div>
          <div className="stat-value text-secondary">{knowledge.length}</div>
        </div>
      </div>

      <div className="bg-base-100 border border-base-300 rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Agents overview</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tasks assigned</th>
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
