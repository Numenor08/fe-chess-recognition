import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import About from "./components/About";
import Landing from "./components/Landing";
import Workspace from "./components/Workspace";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
