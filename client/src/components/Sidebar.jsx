import { Link, useLocation, useParams } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const { boardId } = useParams();

  const links = [
    { name: "Dashboard", path: `/boards/${boardId}` },
    { name: "Agents", path: `/boards/${boardId}/agents` },
    { name: "Roundtable", path: `/boards/${boardId}/roundtable` },
    { name: "Knowledge Base", path: `/boards/${boardId}/knowledge` },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-secondary text-secondary-content flex flex-col">
      <div className="p-6 text-2xl font-display font-semibold">Roundtable</div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-4 py-2 rounded font-medium transition
              ${location.pathname === link.path ? "bg-primary text-primary-content" : "text-secondary-content/80 hover:bg-primary/20"}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 space-y-2">
        <Link to={`/boards/${boardId}/agents`} className="btn btn-primary btn-block">
          Add New Agent
        </Link>
        <Link to="/boards" className="btn btn-ghost btn-block text-secondary-content/70">
          ← All boards
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;