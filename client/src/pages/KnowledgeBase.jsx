import React, { useState } from "react";

const KnowledgeBase = () => {
  const [knowledgeItems, setKnowledgeItems] = useState([
    {
      id: 1,
      title: "Goal Setting Guide",
      type: "PDF",
      agents: ["Life Coach Bot", "Career Mentor"],
      tags: ["personal-growth", "coaching"],
      dateAdded: "2025-08-10",
    },
    {
      id: 2,
      title: "Market Trends Q3",
      type: "Docx",
      agents: ["Business Advisor"],
      tags: ["market", "research"],
      dateAdded: "2025-08-12",
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    agents: "",
    tags: "",
  });

  const [showModal, setShowModal] = useState(false);

  const handleAddKnowledge = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setKnowledgeItems([
      ...knowledgeItems,
      {
        id: Date.now(),
        title: formData.title,
        type: formData.type,
        agents: formData.agents.split(",").map((a) => a.trim()),
        tags: formData.tags.split(",").map((t) => t.trim()),
        dateAdded: new Date().toISOString().split("T")[0],
      },
    ]);

    setFormData({ title: "", type: "", agents: "", tags: "" });
    setShowModal(false);
  };

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          + Add Knowledge
        </button>
      </div>

      {/* Overview Stats */}
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-title">Total Items</div>
          <div className="stat-value">{knowledgeItems.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Agents Linked</div>
          <div className="stat-value">
            {new Set(knowledgeItems.flatMap((i) => i.agents)).size}
          </div>
        </div>
      </div>

      {/* Knowledge Table */}
      <div className="overflow-x-auto bg-base-100 shadow rounded-lg border border-base-300">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Linked Agents</th>
              <th>Tags</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {knowledgeItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {item.agents.map((agent, idx) => (
                      <span
                        key={idx}
                        className="badge badge-primary badge-sm"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="badge badge-outline badge-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{item.dateAdded}</td>
                <td>
                  <button className="btn btn-sm btn-outline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding Knowledge */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Add New Knowledge</h3>
            <form onSubmit={handleAddKnowledge} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="input input-bordered w-full"
                required
              />
              <input
                type="text"
                placeholder="Type (e.g., PDF, DOCX)"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Linked Agents (comma separated)"
                value={formData.agents}
                onChange={(e) =>
                  setFormData({ ...formData, agents: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="input input-bordered w-full"
              />

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
