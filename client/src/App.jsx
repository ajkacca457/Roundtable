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
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

function ProtectedLayout() {
  return (
    <>
      <SignedIn>
        <MainLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function ProtectedBoardList() {
  return (
    <>
      <SignedIn>
        <BoardList />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/boards" replace />,
  },
  {
    path: "/boards",
    element: <ProtectedBoardList />,
  },
  {
    path: "/boards/:boardId",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "agents", element: <AgentGenerator /> },
      { path: "roundtable", element: <CrewChatPage /> },
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