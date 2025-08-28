import React, { useState } from "react";

const KnowledgeBase = () => {
  const [jsonFiles] = useState([
    "ceo_history.json",
  ]);

  const [docxFiles] = useState([
    "Aika Chat Kalle.docx",
    "Aika Chat Mari Claudio.docx",
    "Aika Experiment TNA team.docx",
    "Mari Antonella branding chat.docx",
    "Meet for pitch with Aika Transcript.docx",
    "Pitch checkup.docx",
    "Pitch talk wtih Oxana.docx",
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      {/* JSON Files */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">JSON Files</h2>
        <ul className="list-disc list-inside">
          {jsonFiles.map((file, idx) => (
            <li key={idx}>{file}</li>
          ))}
        </ul>
      </div>

      {/* DOCX Files */}
      <div>
        <h2 className="text-xl font-semibold mb-2">DOCX Files</h2>
        <ul className="list-disc list-inside">
          {docxFiles.map((file, idx) => (
            <li key={idx}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeBase;
