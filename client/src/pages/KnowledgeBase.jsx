import React, { useState, useEffect } from "react";
import { API_URL } from "../utils/env.js";

const KnowledgeBase = () => {
  const [jsonFiles, setJsonFiles] = useState([]);
  const [docxFiles, setDocxFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const res = await fetch(`${API_URL}/knowledge`);
        const data = await res.json();
        setJsonFiles(data.json_files || []);
        setDocxFiles(data.docx_files || []);
      } catch (err) {
        console.error("Error fetching knowledge:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledge();
  }, []);

  if (loading) {
    return <div className="p-6">Loading knowledge base...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      {/* JSON Files */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">JSON Files</h2>
        {jsonFiles.length === 0 ? (
          <p>No JSON files found.</p>
        ) : (
          <ul className="list-disc list-inside">
            {jsonFiles.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        )}
      </div>

      {/* DOCX Files */}
      <div>
        <h2 className="text-xl font-semibold mb-2">DOCX Files</h2>
        {docxFiles.length === 0 ? (
          <p>No DOCX files found.</p>
        ) : (
          <ul className="list-disc list-inside">
            {docxFiles.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
