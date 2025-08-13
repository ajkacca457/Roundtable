import { useState } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";

const router = createBrowserRouter([
  {
    path:"/",
    element: <Navigate to="/dashboard" replace />

  },
  {
    path: "/dashboard",
    element: <MainLayout />,
    children: [{ index: true, element: <Dashboard /> }],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
