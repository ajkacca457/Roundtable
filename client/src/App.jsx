import { useState } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import AgentGenerator from "./pages/AgentGenerator";
import KnowledgeBase from "./pages/KnowledgeBase";
import AgentChat from "./pages/AgentChat";
import CrewChatPage from "./pages/CrewChat";
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
    children: [
      { index: true, element: <Dashboard /> },
      { path:"agents", element: <AgentGenerator /> },
      { path:"agents/:id", element: <AgentChat /> },
      { path:"crew-chat", element: <CrewChatPage /> },
      { path:"knowledge", element: <KnowledgeBase /> }
    ],
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
