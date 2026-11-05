import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function Navigation() {
  const [apiStatus, setApiStatus] = useState("connecting");

  const getStatusColor = () => {
    if (apiStatus === "ok") return "bg-[#72a160]"; // Hijau
    if (apiStatus === "degraded" || apiStatus === "partial")
      return "bg-yellow-500"; // Kuning
    if (apiStatus === "connecting") return "bg-gray-400 animate-pulse"; // Abu-abu berkedip halus
    return "bg-red-500"; // Merah (disconnected)
  };

  const getStatusText = () => {
    if (apiStatus === "ok") return "API ready";
    if (apiStatus === "degraded") return "Model degraded";
    if (apiStatus === "partial") return "Stockfish partial";
    if (apiStatus === "connecting") return "Connecting...";
    return "API disconnected";
  };

  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/health/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setApiStatus(data.status);
      } catch (error) {
        console.error("Gagal membaca respons SSE", error);
        setApiStatus("disconnected");
      }
    };

    eventSource.onerror = () => {
      setApiStatus("disconnected");
    };
    return () => eventSource.close();
  }, []);

  return (
    <header className="flex h-[78px] items-center gap-12 border-b border-[#dce4de] bg-[#f8faf7] px-7 max-[700px]:h-auto max-[700px]:min-h-[70px] max-[700px]:flex-wrap max-[700px]:gap-3 max-[700px]:p-4">
      <Link className="flex items-center gap-3 text-left" to="/">
        <img
          alt="FEN LAB logo"
          className="size-[37px] rounded-xl object-contain"
          src="/logo.png"
        />
        <span>
          <strong className="block text-sm tracking-[0.15em]">FEN LAB</strong>
          <small className="mt-0.5 block text-[10px] text-[#718079]">
            Research prototype
          </small>
        </span>
      </Link>
      <nav className="flex flex-1 items-center gap-7 max-[700px]:order-3 max-[700px]:basis-full max-[700px]:gap-[18px]">
        <NavLink
          end
          className={({ isActive }) =>
            `border-b-2 border-transparent py-7 text-[13px] text-[#718079] hover:border-[#315d49] hover:text-[#17201d] max-[700px]:py-2 ${isActive ? "border-[#315d49] text-[#17201d]" : ""}`
          }
          to="/workspace"
        >
          Analyze position
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `border-b-2 border-transparent py-7 text-[13px] text-[#718079] hover:border-[#315d49] hover:text-[#17201d] max-[700px]:py-2 ${isActive ? "border-[#315d49] text-[#17201d]" : ""}`
          }
          to="/about"
        >
          About
        </NavLink>
      </nav>
      <span className="ml-auto flex items-center gap-2 text-[11px] text-[#718079]">
        <i 
          className={`size-2 rounded-full shadow-[0_0_0_3px_#e0eddc] transition-colors duration-300 ${getStatusColor()}`} 
        /> 
        {getStatusText()}
      </span>
    </header>
  );
}
