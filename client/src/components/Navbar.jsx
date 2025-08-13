const Navbar = () => {
  return (
    <header className="w-full bg-white shadow-md flex justify-between items-center px-6 py-4 sticky top-0 z-10">
      {/* Left section: Page title or breadcrumbs */}
      <div className="text-xl font-semibold text-gray-800">
        Dashboard
      </div>

      {/* Right section: Search bar and user profile */}
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered input-sm w-64"
          />
        </div>

        {/* Notification Icon */}
        <button className="btn btn-ghost btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* User Avatar */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img src="https://i.pravatar.cc/300" alt="User Avatar" />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-white rounded-box w-52 mt-4"
          >
            <li>
              <a>Profile</a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
