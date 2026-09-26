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
        <div className="min-h-screen bg-gray-50">

            {/* MAIN CONTENT */}

            <main>

                {/* TOP BAR */}

                <header className="border-b border-gray-200 bg-white px-6 py-6 lg:px-10">

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                            <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
                                SMS Messages
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Your Impiricus communications
                            </p>
                        </div>


                        {/* SEARCH */}

                        <div className="relative w-full xl:w-96">

                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            )}

                        </div>


                        {/* PROFILE */}

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                                {user.displayName
                                    ? user.displayName.charAt(0).toUpperCase()
                                    : "H"}
                            </div>

                            <div className="hidden xl:block">

                                <p className="text-sm font-semibold text-gray-900">
                                    {user.displayName || "Healthcare Professional"}
                                </p>

                                <p className="text-xs text-gray-500">
                                    HCP
                                </p>

                            </div>

                        </div>

                    </div>

                </header>


                {/* CONTENT */}

                <div className="px-6 py-8 lg:px-10">

                    {/* FILTER BAR */}

                    <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                            <span className="text-sm font-medium text-gray-700">
                                Filter by
                            </span>

                            <select
                                value={selectedDate}
                                onChange={(event) =>
                                    setSelectedDate(event.target.value)
                                }
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
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

                        </div>


                        <div className="text-sm text-gray-500">

                            <span className="font-semibold text-gray-900">
                                {filteredMessages.length}
                            </span>{" "}

                            {filteredMessages.length === 1
                                ? "message"
                                : "messages"}

                        </div>

                    </section>


                    {/* MESSAGE GRID */}

                    <section>

                        {loading ? (

                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
                                Loading messages...
                            </div>

                        ) : filteredMessages.length === 0 ? (

                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

                                <div className="mb-4 text-4xl">
                                    ✉
                                </div>

                                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                                    No messages found
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Try changing your search or filters.
                                </p>

                            </div>

                        ) : (

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                                {filteredMessages.map((message) => (
                                    <SmsCard
                                        key={message.id}
                                        message={message}
                                    />
                                ))}

                            </div>

                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}

export default Sms;