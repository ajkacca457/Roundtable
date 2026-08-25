import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Agents", path: "/dashboard/agents" },
    { name: "Crew Chat", path: "/dashboard/crew-chat" },
    { name: "Knowledge Base", path: "/dashboard/knowledge" },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-md flex flex-col">
      <div className="p-6 text-2xl font-bold text-primary">Roundtable</div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-2 rounded font-medium transition 
              ${location.pathname === link.path ? "bg-primary text-white" : "text-gray-700 hover:bg-primary hover:text-white"}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <Link to="/dashboard/agents" className="btn btn-primary btn-block">
          Add New Agent
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
