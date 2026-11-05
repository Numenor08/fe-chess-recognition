import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import About from "./components/About";
import Landing from "./components/Landing";
import Workspace from "./components/Workspace";

function MainLayout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
