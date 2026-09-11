import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApiFetch } from "../hooks/useApiFetch";

const KnowledgeBase = () => {
  const { boardId } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const { apiFetch, isLoaded, isSignedIn } = useApiFetch();

  const fetchEntries = async () => {
    try {
      const res = await apiFetch(`/knowledge?board_id=${boardId}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch knowledge:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchEntries();
    }
  }, [boardId, isLoaded, isSignedIn]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const payload = {
      title,
      content,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      await apiFetch(`/knowledge?board_id=${boardId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTitle("");
      setContent("");
      setTags("");
      fetchEntries();
    } catch (err) {
      console.error("Error adding knowledge entry:", err);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-base-content mb-6">
        Board knowledge
      </h1>

      {loading ? (
        <p>Loading knowledge base...</p>
      ) : entries.length === 0 ? (
        <p className="text-base-content/60 mb-10">
          No knowledge added yet. Add notes or policies below for advisors to
          draw on.
        </p>
      ) : (
        <ul className="mb-10 border-t border-base-300">
          {entries.map((entry) => (
            <li key={entry.id} className="py-4 border-b border-base-300">
              <h2 className="font-display text-lg">{entry.title}</h2>
              <p className="text-base-content/80 mt-1">{entry.content}</p>
              {entry.tags.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="badge badge-outline">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="bg-base-100 border border-base-300 rounded p-6">
        <h2 className="font-display text-lg mb-4">Add knowledge</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="text"
            placeholder="Title (e.g. Injury policy)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea textarea-bordered w-full"
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input input-bordered w-full"
          />
          <div className="flex justify-end">
            <button className="btn btn-primary">Add to board</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgeBase;
