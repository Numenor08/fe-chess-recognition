import { Link, NavLink } from "react-router-dom";

export function Navigation() {
  return (
    <header className="flex h-[78px] items-center gap-12 border-b border-[#dce4de] bg-[#f8faf7] px-7 max-[700px]:h-auto max-[700px]:min-h-[70px] max-[700px]:flex-wrap max-[700px]:gap-3 max-[700px]:p-4">
      <Link className="flex items-center gap-3 text-left" to="/">
        <span className="grid size-[37px] place-items-center rounded-xl bg-[#315d49] text-[25px] text-[#d9f27e]">♞</span>
        <span>
          <strong className="block text-sm tracking-[0.15em]">FEN LAB</strong>
          <small className="mt-0.5 block text-[10px] text-[#718079]">Research prototype</small>
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
        <i className="size-2 rounded-full bg-[#72a160] shadow-[0_0_0_3px_#e0eddc]" /> API ready
      </span>
    </header>
  );
}
