import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import Home from "./pages/Home";
import VideoConverter from "./pages/VideoConverter";
import UrlConverter from "./pages/UrlConverter";
import DocumentConverter from "./pages/DocumentConverter";
import Result from "./pages/Result";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import PptxCreate from "./pages/PptxCreate";
import PptxJobDetail from "./pages/PptxJobDetail";
import PptxHistory from "./pages/PptxHistory";
import TaskDetail from "./pages/TaskDetail";
import { initSession } from "./utils/tracking";
import "@/stores/themeStore";

export default function App() {
  useEffect(() => {
    initSession();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/video" element={<VideoConverter />} />
        <Route path="/url" element={<UrlConverter />} />
        <Route path="/document" element={<DocumentConverter />} />
        <Route path="/task/:taskId" element={<TaskDetail />} />
        <Route path="/result/:resultId" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/pptx" element={<PptxCreate />} />
        <Route path="/pptx/job/:jobId" element={<PptxJobDetail />} />
        <Route path="/pptx/history" element={<PptxHistory />} />
      </Route>
    </Routes>
  );
}
