import "./App.css";
import BoardList from "./pages/BoardList";
import Dashboard from "./pages/Dashboard";
import AgentGenerator from "./pages/AgentGenerator";
import KnowledgeBase from "./pages/KnowledgeBase";
import CrewChatPage from "./pages/CrewChat";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/boards" replace />,
  },
  {
    path: "/boards",
    element: <BoardList />,
  },
  {
    path: "/boards/:boardId",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "agents", element: <AgentGenerator /> },
      { path: "crew-chat", element: <CrewChatPage /> },
      { path: "knowledge", element: <KnowledgeBase /> },
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