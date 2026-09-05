import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/env.js";

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const fetchBoards = async () => {
    try {
      const res = await fetch(`${API_URL}/boards`);
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      console.error("Failed to fetch boards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await fetch(`${API_URL}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      setName("");
      setDescription("");
      fetchBoards();
    } catch (err) {
      console.error("Error creating board:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/boards/${id}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Error deleting board:", err);
    }
  };

  if (loading) return <p className="p-6">Loading boards...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Your boards</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {boards.map((board) => (
          <div
            key={board.id}
            className="card bg-base-100 shadow border border-base-300 cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <div className="card-body">
              <h2 className="card-title">{board.name}</h2>
              <p className="text-gray-500">{board.description}</p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-sm btn-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Create a new board</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Board name (e.g. Football Team)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full"
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full"
            />
            <div className="flex justify-end">
              <button className="btn btn-primary">Create board</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BoardList;
