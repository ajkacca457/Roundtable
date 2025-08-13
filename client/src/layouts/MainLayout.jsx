import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from "../components/Navbar"
import Sidebar from '../components/Sidebar'

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
