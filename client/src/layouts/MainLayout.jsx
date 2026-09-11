import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from "../components/Navbar"
import Sidebar from '../components/Sidebar'

export const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
