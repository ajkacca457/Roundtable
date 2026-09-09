import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiFetch } from "../hooks/useApiFetch";

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { apiFetch, isLoaded, isSignedIn } = useApiFetch();

  const fetchBoards = async () => {
    try {
      const res = await apiFetch("/boards");
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      console.error("Failed to fetch boards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchBoards();
    }
  }, [isLoaded, isSignedIn]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await apiFetch("/boards", {
        method: "POST",
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
      await apiFetch(`/boards/${id}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Error deleting board:", err);
    }
  };

  if (loading) return <p className="p-10 font-sans">Loading boards...</p>;

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl text-base-content mb-1">
          Your boards
        </h1>
        <p className="text-base-content/60 mb-10">
          Each board is its own advisory panel — agents, knowledge, and memory
          stay within it.
        </p>

        {boards.length > 0 && (
          <ul className="mb-12 border-t border-base-300">
            {boards.map((board) => (
              <li
                key={board.id}
                className="group flex items-center justify-between py-5 border-b border-base-300 cursor-pointer"
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                <div>
                  <h2 className="font-display text-xl text-base-content group-hover:text-primary transition-colors">
                    {board.name}
                  </h2>
                  {board.description && (
                    <p className="text-base-content/60 text-sm mt-1">
                      {board.description}
                    </p>
                  )}
                </div>
                <button
                  className="text-sm text-base-content/40 hover:text-error transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <h2 className="font-display text-lg text-base-content">
            Create a new board
          </h2>
          <input
            type="text"
            placeholder="Board name (e.g. Football Team)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full bg-base-100"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100"
          />
          <button className="btn btn-primary">Create board</button>
        </form>
      </div>
    </div>
  );
};

export default BoardList;
