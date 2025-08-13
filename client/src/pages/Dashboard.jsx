const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Total Agents</div>
          <div className="stat-value text-primary">12</div>
          <div className="stat-desc">3 active now</div>
        </div>

        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Tasks Completed</div>
          <div className="stat-value text-secondary">245</div>
          <div className="stat-desc">+15 this week</div>
        </div>

        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Knowledge Items</div>
          <div className="stat-value text-accent">1,032</div>
          <div className="stat-desc">+120 this month</div>
        </div>

        <div className="stat bg-white shadow rounded-xl p-4">
          <div className="stat-title text-gray-500">Active Users</div>
          <div className="stat-value text-green-500">58</div>
          <div className="stat-desc">+8 today</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <ul className="space-y-3">
          <li className="flex justify-between border-b pb-2">
            <span>Agent "SalesBot" completed task "Follow up with leads"</span>
            <span className="text-gray-400 text-sm">2h ago</span>
          </li>
          <li className="flex justify-between border-b pb-2">
            <span>Knowledge base updated with "New Pricing Structure"</span>
            <span className="text-gray-400 text-sm">5h ago</span>
          </li>
          <li className="flex justify-between">
            <span>User "Anna" created new agent "HR Helper"</span>
            <span className="text-gray-400 text-sm">1 day ago</span>
          </li>
        </ul>
      </div>

      {/* Agents Table */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Agents Overview</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Tasks Assigned</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SalesBot</td>
                <td>
                  <span className="badge badge-success">Active</span>
                </td>
                <td>32</td>
                <td>2 hours ago</td>
              </tr>
              <tr>
                <td>HR Helper</td>
                <td>
                  <span className="badge badge-warning">Idle</span>
                </td>
                <td>12</td>
                <td>1 day ago</td>
              </tr>
              <tr>
                <td>ContentWriter</td>
                <td>
                  <span className="badge badge-error">Offline</span>
                </td>
                <td>0</td>
                <td>3 days ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
