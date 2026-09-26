import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
} from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../firebase/auth";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Sms from "../pages/Sms";
import DiscussionPage from "../pages/DiscussionPage";
import InformationPage from "../pages/Information";
import Navbar from "../components/Navbar";

function ProtectedRoute({
    user,
    loading,
}: {
    user: User | null;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

function PublicRoute({
    user,
    loading,
    children,
}: {
    user: User | null;
    loading: boolean;
    children: React.ReactNode;
}) {
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (user) {
        return <Navigate to="/app" replace />;
    }

    return <>{children}</>;
}


function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50">

            <Navbar />

            <main>
                <Outlet />
            </main>

        </div>
    );
}


function Dashboard() {
    return (
        <div className="mx-auto max-w-7xl px-6 py-10">

            <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
                Your personalized Impiricus dashboard.
            </p>

        </div>
    );
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <PublicRoute
                            user={user}
                            loading={loading}
                        >
                            <Login />
                        </PublicRoute>
                    }
                />


                {/* REGISTER */}

                <Route
                    path="/register"
                    element={
                        <PublicRoute
                            user={user}
                            loading={loading}
                        >
                            <Register />
                        </PublicRoute>
                    }
                />


                {/* PROTECTED APP */}

                <Route
                    element={
                        <ProtectedRoute
                            user={user}
                            loading={loading}
                        />
                    }
                >

                    <Route
                        element={<AppLayout />}
                    >

                        {/* SMS */}

                        <Route
                            path="/app"
                            element={<Sms />}
                        />


                        {/* DASHBOARD */}

                        <Route
                            path="/app/dashboard"
                            element={<Dashboard />}
                        />


                        {/* DISCUSSION */}

                        <Route
                            path="/app/discussion"
                            element={<DiscussionPage />}
                        />


                        {/* INFORMATION */}

                        <Route
                            path="/app/information"
                            element={<InformationPage />}
                        />

                    </Route>

                </Route>


                {/* DEFAULT */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to={user ? "/app" : "/login"}
                            replace
                        />
                    }
                />


                {/* UNKNOWN ROUTES */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to={user ? "/app" : "/login"}
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;