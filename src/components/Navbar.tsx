import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* LOGO */}

                <div className="text-xl font-bold tracking-tight text-gray-900">
                    IMPIRICUS
                </div>


                {/* NAVIGATION */}

                <div className="flex items-center gap-1">

                    <NavLink
                        to="/app/dashboard"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/app"
                        end
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                    >
                        SMS Messages
                    </NavLink>

                                        <NavLink
                        to="/app/peer-connect"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-black text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        Peer Connect
                    </NavLink>

                    <NavLink
                        to="/app/discussion"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                    >
                        Discussion
                    </NavLink>

                    <NavLink
                        to="/app/information"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition ${
                                isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                    >
                        Information
                    </NavLink>
                </div>


                {/* PROFILE */}

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    H
                </div>

            </div>
        </nav>
    );
}

export default Navbar;