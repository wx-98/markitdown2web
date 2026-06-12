import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import VideoConverter from "./pages/VideoConverter";
import UrlConverter from "./pages/UrlConverter";
import DocumentConverter from "./pages/DocumentConverter";
import Result from "./pages/Result";
import History from "./pages/History";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/video" element={<VideoConverter />} />
        <Route path="/url" element={<UrlConverter />} />
        <Route path="/document" element={<DocumentConverter />} />
        <Route path="/result/:resultId" element={<Result />} />
        <Route path="/history" element={<History />} />
      </Route>
    </Routes>
  );
}
