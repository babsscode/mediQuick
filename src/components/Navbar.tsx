import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../firebase/auth";

function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return unsubscribe;
    }, []);

    const getInitials = () => {
        const name = user?.displayName;

        if (!name) {
            return "H";
        }

        const parts = name
            .trim()
            .split(/\s+/)
            .filter((part) => part.toLowerCase() !== "dr.");

        if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }

        return (
            parts[0][0] + parts[parts.length - 1][0]
        ).toUpperCase();
    };

    const navClass = ({ isActive }: { isActive: boolean }) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition ${
            isActive
                ? "bg-[#B7D8D6] text-[#4D6466]"
                : "text-[#EEF3D8] hover:bg-[#789E9E] hover:text-[#EEF3D8]"
        }`;

    return (
        <nav className="border-b border-[#789E9E] bg-[#4D6466]">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* LOGO */}
                <div className="text-xl font-bold tracking-tight text-[#EEF3D8]">
                    IMPIRICUS
                </div>

                {/* NAVIGATION */}
                <div className="flex items-center gap-1">

                    <NavLink
                        to="/app/dashboard"
                        className={navClass}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/app"
                        end
                        className={navClass}
                    >
                        Resources
                    </NavLink>

                    <NavLink
                        to="/app/peer-connect"
                        className={navClass}
                    >
                        Peer Connect
                    </NavLink>

                    <NavLink
                        to="/app/discussion"
                        className={navClass}
                    >
                        Discussion
                    </NavLink>

                    <NavLink
                        to="/app/information"
                        className={navClass}
                    >
                        Information
                    </NavLink>
                </div>

                {/* PROFILE */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B7D8D6] text-sm font-semibold text-[#4D6466]">
                    {getInitials()}
                </div>

            </div>
        </nav>
    );
}

export default Navbar;