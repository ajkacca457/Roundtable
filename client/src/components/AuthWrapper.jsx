import React, { useState } from "react";

const PASSWORD = "aika-humanic-admin";

const AuthWrapper = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      setAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (authorized) return children;

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          placeholder="Enter password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input input-bordered"
        />
        <button type="submit" className="btn btn-primary">Enter</button>
      </form>
    </div>
  );
};

export default AuthWrapper;
