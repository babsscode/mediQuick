import { NavLink } from "react-router-dom";

function navClass({ isActive }: { isActive: boolean }) {
    return `rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive
            ? "bg-mist text-heading"
            : "text-ink hover:bg-canvas hover:text-heading"
    }`;
}

function Navbar() {
    return (
        <nav className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                <div className="text-lg font-bold tracking-tight text-heading">
                    IMPIRICUS
                </div>

                <div className="flex items-center gap-1">
                    <NavLink to="/app/dashboard" className={navClass}>
                        Dashboard
                    </NavLink>

                    <NavLink to="/app" end className={navClass}>
                        Resources
                    </NavLink>

                    <NavLink to="/app/peer-connect" className={navClass}>
                        Peer Connect
                    </NavLink>

                    <NavLink to="/app/discussion" className={navClass}>
                        Discussion
                    </NavLink>

                    <NavLink to="/app/information" className={navClass}>
                        Information
                    </NavLink>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-sm font-semibold text-heading">
                    H
                </div>

            </div>
        </nav>
    );
}

export default Navbar;
