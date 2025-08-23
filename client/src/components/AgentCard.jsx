import React from "react";
import { Link } from "react-router-dom";

const AgentCard = ({ agent, onDelete }) => {
  console.log("Rendering AgentCard for agent:", agent);

  return (
    <div className="card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-shadow duration-200">
      <div className="card-body">
        <h2 className="card-title text-lg font-bold">{agent.name}</h2>
        <p className="text-sm text-gray-500 mb-2">{agent.description}</p>

        {agent.goal && (
          <div className="mb-2">
            <h3 className="font-semibold text-sm">Goal:</h3>
            <p className="text-sm text-gray-700">{agent.goal}</p>
          </div>
        )}

        {agent.backstory && (
          <div className="mb-2">
            <h3 className="font-semibold text-sm">Backstory:</h3>
            <p className="text-sm text-gray-700">{agent.backstory}</p>
          </div>
        )}

        {agent.tasks?.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm">Tasks:</h3>
            <ul className="list-disc list-inside text-sm">
              {agent.tasks.map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-actions justify-between mt-4">
          <Link
            to={`/dashboard/agents/${agent.id}`}
            className="btn btn-primary btn-sm"
          >
            Chat
          </Link>
          <button
            onClick={() => onDelete(agent.id)}
            className="btn btn-error btn-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
