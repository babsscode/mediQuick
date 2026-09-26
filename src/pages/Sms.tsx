import { useEffect, useMemo, useState } from "react";

import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import {
    onAuthStateChanged,
    type User,
} from "firebase/auth";

import { db } from "../firebase/firestore";
import { auth } from "../firebase/auth";

import type { SmsMessage } from "../types";
import SmsCard from "../components/SmsCard";
import { Link } from "react-router-dom";


function Sms() {
    const [user, setUser] = useState<User | null>(null);

    const [messages, setMessages] = useState<SmsMessage[]>([]);

    const [search, setSearch] = useState("");

    const [selectedDate, setSelectedDate] = useState("All");

    const [loading, setLoading] = useState(true);


    /*
     * Get the currently logged-in user.
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
            }
        );

        return () => unsubscribe();
    }, []);


    /*
     * Get SMS messages belonging to this user.
     *
     * Firestore structure:
     *
     * users/{userId}/messages/{messageId}
     *
     * {
     *   userId: "...",
     *   text: "...",
     *   createdAt: Timestamp
     * }
     */
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const messagesRef = collection(
            db,
            "users",
            user.uid,
            "messages"
        );

        const messagesQuery = query(
            messagesRef,
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                const firebaseMessages: SmsMessage[] =
                    snapshot.docs.map((document) => ({
                        id: document.id,
                        ...document.data(),
                    })) as SmsMessage[];

                setMessages(firebaseMessages);
                setLoading(false);
            },
            (error) => {
                console.error(
                    "Error loading SMS messages:",
                    error
                );

                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);


    /*
     * Filter messages based on search and date.
     */
    const filteredMessages = useMemo(() => {
        return messages.filter((message) => {
            /*
             * Search message text.
             */
            const searchLower =
                search.toLowerCase().trim();

            const matchesSearch =
                searchLower === "" ||
                message.text
                    .toLowerCase()
                    .includes(searchLower);


            /*
             * Date filter.
             */
            let matchesDate = true;

            if (
                selectedDate !== "All" &&
                message.createdAt
            ) {
                const messageDate =
                    message.createdAt.toDate();

                const now = new Date();

                if (selectedDate === "7") {
                    const sevenDaysAgo =
                        new Date();

                    sevenDaysAgo.setDate(
                        now.getDate() - 7
                    );

                    matchesDate =
                        messageDate >=
                        sevenDaysAgo;
                }

                if (selectedDate === "30") {
                    const thirtyDaysAgo =
                        new Date();

                    thirtyDaysAgo.setDate(
                        now.getDate() - 30
                    );

                    matchesDate =
                        messageDate >=
                        thirtyDaysAgo;
                }

                if (selectedDate === "90") {
                    const ninetyDaysAgo =
                        new Date();

                    ninetyDaysAgo.setDate(
                        now.getDate() - 90
                    );

                    matchesDate =
                        messageDate >=
                        ninetyDaysAgo;
                }
            }

            return (
                matchesSearch &&
                matchesDate
            );
        });
    }, [
        messages,
        search,
        selectedDate,
    ]);


    /*
     * User isn't signed in.
     */
    if (!user) {
        return (
            <div className="login-message">
                Please sign in to view your messages.
            </div>
        );
    }


    return (
        <div className="app">

            {/* SIDEBAR */}

            <aside className="sidebar">

                <div className="logo">
                    IMPIRICUS
                </div>

                <nav>

                    <Link to="/app/discussion">
                        Discussion
                    </Link>

                    <a
                        className="nav-item"
                        href="#"
                    >
                        <span>◉</span>
                        Dashboard
                    </a>

                    <a
                        className="nav-item"
                        href="#"
                    >
                        <span>♡</span>
                        Saved
                    </a>

                </nav>

                <div className="sidebar-bottom">

                    <a
                        className="nav-item"
                        href="#"
                    >
                        <span>⚙</span>
                        Settings
                    </a>

                </div>

            </aside>


            {/* MAIN CONTENT */}

            <main className="main">

                {/* TOP BAR */}

                <header className="top-bar">

                    <div className="page-title">

                        <h1>
                            SMS Messages
                        </h1>

                        <p>
                            Your Impiricus communications
                        </p>

                    </div>


                    {/* SEARCH */}

                    <div className="search-container">

                        <span className="search-icon">
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}

                    </div>


                    {/* PROFILE */}

                    <div className="profile">

                        <div className="profile-avatar">

                            {user.displayName
                                ? user.displayName.charAt(0)
                                : "H"}

                        </div>

                        <div>

                            <strong>
                                {user.displayName ||
                                    "Healthcare Professional"}
                            </strong>

                            <span>
                                HCP
                            </span>

                        </div>

                    </div>

                </header>


                {/* FILTER BAR */}

                <section className="filter-section">

                    <div className="filter-label">
                        Filter by
                    </div>


                    {/* DATE FILTER */}

                    <select
                        value={selectedDate}
                        onChange={(event) =>
                            setSelectedDate(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            Any date
                        </option>

                        <option value="7">
                            Last 7 days
                        </option>

                        <option value="30">
                            Last 30 days
                        </option>

                        <option value="90">
                            Last 90 days
                        </option>

                    </select>


                    {/* MESSAGE COUNT */}

                    <div className="message-count">

                        {filteredMessages.length}{" "}

                        {filteredMessages.length === 1
                            ? "message"
                            : "messages"}

                    </div>

                </section>


                {/* MESSAGE GRID */}

                <section className="messages-container">

                    {loading ? (

                        <div className="empty-state">
                            Loading messages...
                        </div>

                    ) : filteredMessages.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                ✉
                            </div>

                            <h2>
                                No messages found
                            </h2>

                            <p>
                                Try changing your search
                                or filters.
                            </p>

                        </div>

                    ) : (

                        <div className="sms-grid">

                            {filteredMessages.map(
                                (message) => (
                                    <SmsCard
                                        key={message.id}
                                        message={message}
                                    />
                                )
                            )}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default Sms;