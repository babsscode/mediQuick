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
import ResourceCard from "../components/ResourceCard";


type Resource = {
    id: string;
    title: string;
    description: string;
    topic: string;
    category: string;
    date: string;
};


type ContentType =
    | "all"
    | "sms"
    | "resource";


type AiSearchResult = {
    id: string;

    resultType:
        | "sms"
        | "resource";

    /*
     * SMS fields
     */
    text?: string;
    link?: string;
    type?: string;
    createdAt?: unknown;

    /*
     * Resource fields
     */
    title?: string;
    description?: string;
    topic?: string;
    category?: string;
    date?: string;

    /*
     * Optional ranking information.
     */
    score?: number;
    relevance?: number;
};


const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";


const sampleResources: Resource[] = [
    {
        id: "resource-1",
        title: "Treatment-Resistant Hypertension Guide",
        description:
            "A clinical guide covering treatment considerations for patients whose blood pressure remains uncontrolled despite multiple therapies.",
        topic: "Hypertension",
        category: "Clinical Guide",
        date: "Sep 24, 2026",
    },
    {
        id: "resource-2",
        title: "Heart Failure Treatment Overview",
        description:
            "An overview of current approaches to heart failure treatment, monitoring, and treatment sequencing.",
        topic: "Heart Failure",
        category: "Clinical Resource",
        date: "Sep 23, 2026",
    },
    {
        id: "resource-3",
        title: "Cardiovascular Clinical Trials Directory",
        description:
            "Browse ongoing cardiovascular clinical trials and explore study information and eligibility criteria.",
        topic: "Clinical Trials",
        category: "Clinical Trials",
        date: "Sep 21, 2026",
    },
    {
        id: "resource-4",
        title: "Patient Access & Coverage Guide",
        description:
            "Information designed to help HCPs navigate common patient access, coverage, and insurance questions.",
        topic: "Patient Access",
        category: "Patient Support",
        date: "Sep 20, 2026",
    },
    {
        id: "resource-5",
        title: "ACE Inhibitor Reference",
        description:
            "Reference material covering ACE inhibitors, their clinical use, and cardiovascular treatment considerations.",
        topic: "ACE Inhibitors",
        category: "Reference",
        date: "Sep 18, 2026",
    },
    {
        id: "resource-6",
        title: "Diabetes & Cardiovascular Health",
        description:
            "Educational material exploring cardiovascular considerations when managing patients with diabetes.",
        topic: "Diabetes",
        category: "Educational Resource",
        date: "Sep 17, 2026",
    },
    {
        id: "resource-7",
        title: "Hypertension Patient Discussion Guide",
        description:
            "A patient-facing resource designed to support conversations about blood pressure goals and treatment.",
        topic: "Hypertension",
        category: "Patient Resource",
        date: "Sep 15, 2026",
    },
    {
        id: "resource-8",
        title: "Heart Failure Monitoring Checklist",
        description:
            "A practical reference for monitoring patients with heart failure during ongoing treatment.",
        topic: "Heart Failure",
        category: "Clinical Tool",
        date: "Sep 13, 2026",
    },
    {
        id: "resource-9",
        title: "Cardiovascular Prevention Reference",
        description:
            "A reference covering cardiovascular risk factors, prevention strategies, and patient conversations.",
        topic: "Cardiology",
        category: "Reference",
        date: "Sep 11, 2026",
    },
    {
        id: "resource-10",
        title: "Specialist Referral & Care Coordination",
        description:
            "Resources for coordinating care between primary care providers and cardiovascular specialists.",
        topic: "Care Coordination",
        category: "Practice Resource",
        date: "Sep 9, 2026",
    },
    {
        id: "resource-11",
        title: "Blood Pressure Monitoring Guide",
        description:
            "A practical guide to monitoring blood pressure and identifying patterns that may require additional evaluation.",
        topic: "Hypertension",
        category: "Clinical Tool",
        date: "Sep 8, 2026",
    },
    {
        id: "resource-12",
        title: "Cardiac Risk Assessment Reference",
        description:
            "Reference material for assessing cardiovascular risk factors during routine clinical care.",
        topic: "Cardiology",
        category: "Reference",
        date: "Sep 7, 2026",
    },
    {
        id: "resource-13",
        title: "Heart Failure Patient Education",
        description:
            "Educational material to support conversations with patients about heart failure symptoms, treatment, and monitoring.",
        topic: "Heart Failure",
        category: "Patient Resource",
        date: "Sep 6, 2026",
    },
    {
        id: "resource-14",
        title: "Clinical Trial Eligibility Checklist",
        description:
            "A quick reference for reviewing common eligibility considerations when identifying potential clinical trial candidates.",
        topic: "Clinical Trials",
        category: "Clinical Tool",
        date: "Sep 5, 2026",
    },
    {
        id: "resource-15",
        title: "Managing Cardiovascular Risk in Diabetes",
        description:
            "Clinical education covering cardiovascular risk considerations for patients with diabetes.",
        topic: "Diabetes",
        category: "Clinical Resource",
        date: "Sep 4, 2026",
    },
    {
        id: "resource-16",
        title: "Medication Adherence Discussion Guide",
        description:
            "A resource for discussing medication adherence, treatment barriers, and patient concerns.",
        topic: "Patient Care",
        category: "Patient Resource",
        date: "Sep 3, 2026",
    },
    {
        id: "resource-17",
        title: "Hypertension Treatment Planning Tool",
        description:
            "A clinical planning resource for evaluating treatment approaches and monitoring blood pressure control.",
        topic: "Hypertension",
        category: "Clinical Tool",
        date: "Sep 2, 2026",
    },
    {
        id: "resource-18",
        title: "Cardiology Clinical Education Hub",
        description:
            "A collection of educational materials covering cardiovascular conditions, treatment, and prevention.",
        topic: "Cardiology",
        category: "Educational Resource",
        date: "Sep 1, 2026",
    },
    {
        id: "resource-19",
        title: "Care Coordination Best Practices",
        description:
            "Resources focused on communication and coordination between primary care providers and specialists.",
        topic: "Care Coordination",
        category: "Practice Resource",
        date: "Aug 30, 2026",
    },
    {
        id: "resource-20",
        title: "Patient Conversation Starter Guide",
        description:
            "A collection of prompts and resources to support productive conversations between HCPs and patients.",
        topic: "Patient Care",
        category: "Patient Resource",
        date: "Aug 28, 2026",
    },
];


function Sms() {

    const [user, setUser] =
        useState<User | null>(null);

    const [messages, setMessages] =
        useState<SmsMessage[]>([]);

    const [search, setSearch] =
        useState("");

    const [contentType, setContentType] =
        useState<ContentType>("all");

    const [loading, setLoading] =
        useState(true);

    const [aiResults, setAiResults] =
        useState<AiSearchResult[]>([]);

    const [aiSearching, setAiSearching] =
        useState(false);

    const [aiSearchError, setAiSearchError] =
        useState("");


    /*
     * Get current Firebase user.
     */
    useEffect(() => {

        const unsubscribe =
            onAuthStateChanged(
                auth,
                (currentUser) => {
                    setUser(currentUser);
                }
            );

        return () => unsubscribe();

    }, []);


    /*
     * Load this user's messages.
     */
    useEffect(() => {

        if (!user) {

            setMessages([]);
            setLoading(false);

            return;
        }

        setLoading(true);

        const messagesRef =
            collection(
                db,
                "users",
                user.uid,
                "messages"
            );

        const messagesQuery =
            query(
                messagesRef,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const unsubscribe =
            onSnapshot(
                messagesQuery,
                (snapshot) => {

                    const firebaseMessages =
                        snapshot.docs.map(
                            (document) => ({
                                id: document.id,
                                ...document.data(),
                            })
                        ) as SmsMessage[];

                    setMessages(
                        firebaseMessages
                    );

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
     * Basic local SMS search.
     */
    const filteredMessages =
        useMemo(() => {

            const searchLower =
                search
                    .toLowerCase()
                    .trim();

            if (!searchLower) {
                return messages;
            }

            return messages.filter(
                (message) =>
                    message.text
                        .toLowerCase()
                        .includes(searchLower)
            );

        }, [
            messages,
            search,
        ]);


    /*
     * Basic local resource search.
     */
    const filteredResources =
        useMemo(() => {

            const searchLower =
                search
                    .toLowerCase()
                    .trim();

            if (!searchLower) {
                return sampleResources;
            }

            return sampleResources.filter(
                (resource) => {

                    return (
                        resource.title
                            .toLowerCase()
                            .includes(searchLower) ||

                        resource.description
                            .toLowerCase()
                            .includes(searchLower) ||

                        resource.topic
                            .toLowerCase()
                            .includes(searchLower) ||

                        resource.category
                            .toLowerCase()
                            .includes(searchLower)
                    );
                }
            );

        }, [
            search,
        ]);


    /*
     * Number of direct/basic matches.
     */
    const directResultCount =
        filteredMessages.length +
        filteredResources.length;


    /*
     * AI fallback search.
     *
     * Only call the API if the normal search
     * cannot find anything.
     */
    useEffect(() => {

        const searchText =
            search.trim();

        if (!searchText) {

            setAiResults([]);
            setAiSearchError("");
            setAiSearching(false);

            return;
        }

        /*
         * Basic search already found something.
         */
        if (directResultCount > 0) {

            setAiResults([]);
            setAiSearchError("");
            setAiSearching(false);

            return;
        }

        if (!user) {
            return;
        }


        let cancelled = false;


        /*
         * Wait 500ms after typing stops before
         * calling the API.
         */
        const timeoutId =
            window.setTimeout(
                async () => {

                    try {

                        setAiSearching(true);
                        setAiSearchError("");


                        /*
                         * Firebase authentication token.
                         */
                        const token =
                            await user.getIdToken();


                        const response =
                            await fetch(
                                `${API_BASE_URL}/messages/search`,
                                {
                                    method:
                                        "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        Authorization:
                                            `Bearer ${token}`,
                                    },

                                    body:
                                        JSON.stringify({
                                            query:
                                                searchText,

                                            limit:
                                                10,
                                        }),
                                }
                            );


                        if (!response.ok) {

                            const errorText =
                                await response.text();

                            throw new Error(
                                errorText ||
                                `Search failed with status ${response.status}`
                            );
                        }


                        const data =
                            await response.json();


                        if (cancelled) {
                            return;
                        }


                        setAiResults(
                            Array.isArray(
                                data.results
                            )
                                ? data.results
                                : []
                        );

                    } catch (error) {

                        if (cancelled) {
                            return;
                        }

                        console.error(
                            "AI search error:",
                            error
                        );

                        setAiResults([]);

                        setAiSearchError(
                            "AI search is temporarily unavailable."
                        );

                    } finally {

                        if (!cancelled) {
                            setAiSearching(false);
                        }
                    }

                },
                500
            );


        return () => {

            cancelled = true;

            window.clearTimeout(
                timeoutId
            );

        };

    }, [
        search,
        user,
        directResultCount,
    ]);


    /*
     * AI-ranked SMS results.
     *
     * IMPORTANT:
     *
     * We only return actual SmsMessage objects
     * already loaded from Firestore.
     *
     * This avoids the previous TypeScript error.
     */
    const aiMessages =
        useMemo(() => {

            const results =
                aiResults.filter(
                    (result) =>
                        result.resultType ===
                        "sms"
                );

            return results
                .map(
                    (result) =>
                        messages.find(
                            (message) =>
                                message.id ===
                                result.id
                        )
                )
                .filter(
                    (
                        message
                    ): message is SmsMessage =>
                        message !== undefined
                );

        }, [
            aiResults,
            messages,
        ]);


    /*
     * AI-ranked resources.
     *
     * We first find the resource in the existing
     * sampleResources array.
     *
     * This means ResourceCard receives the exact
     * Resource type it expects.
     */
    const aiResources =
        useMemo(() => {

            const results =
                aiResults.filter(
                    (result) =>
                        result.resultType ===
                        "resource"
                );

            return results
                .map(
                    (result) =>
                        sampleResources.find(
                            (resource) =>
                                resource.id ===
                                result.id
                        )
                )
                .filter(
                    (
                        resource
                    ): resource is Resource =>
                        resource !== undefined
                );

        }, [
            aiResults,
        ]);


    /*
     * When basic search has no matches, use
     * the AI-ranked results.
     */
    const displayedMessages =
        directResultCount === 0 &&
        search.trim() !== ""
            ? aiMessages
            : filteredMessages;


    const displayedResources =
        directResultCount === 0 &&
        search.trim() !== ""
            ? aiResources
            : filteredResources;


    const showSms =
        contentType === "all" ||
        contentType === "sms";


    const showResources =
        contentType === "all" ||
        contentType === "resource";


    const searching =
        aiSearching &&
        search.trim() !== "" &&
        directResultCount === 0;


    const totalResults =
        (showSms
            ? displayedMessages.length
            : 0) +

        (showResources
            ? displayedResources.length
            : 0);


    /*
     * User isn't signed in.
     */
    if (!user) {

        return (
            <div className="login-message">
                Please sign in to view your resources.
            </div>
        );
    }


    return (

        <div className="min-h-screen bg-gray-50">

            <main className="lg:ml-64">

                {/* TOP BAR */}

                <header className="border-b border-gray-200 bg-white px-6 py-6 lg:px-10">

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                        <div>

                            <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
                                Resources
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Your Impiricus information hub
                            </p>

                        </div>


                        {/* SEARCH */}

                        <div className="relative w-full xl:w-96">

                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                            />

                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
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
                                    ? user.displayName
                                        .charAt(0)
                                        .toUpperCase()
                                    : "H"}

                            </div>

                            <div className="hidden xl:block">

                                <p className="text-sm font-semibold text-gray-900">
                                    {user.displayName ||
                                        "Healthcare Professional"}
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


                    {/* AI SEARCH STATUS */}

                    {aiSearching &&
                        search.trim() !== "" &&
                        directResultCount === 0 && (

                            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">

                                Searching your resources with AI...

                            </div>

                        )}


                    {aiSearchError !== "" && (

                        <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">

                            {aiSearchError}

                        </div>

                    )}


                    {/* FILTER BAR */}

                    <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex flex-wrap items-center gap-3">

                            <span className="text-sm font-medium text-gray-700">
                                Show
                            </span>


                            <div className="flex rounded-lg border border-gray-200 bg-white p-1">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentType(
                                            "all"
                                        )
                                    }
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                        contentType ===
                                        "all"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    All
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentType(
                                            "sms"
                                        )
                                    }
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                        contentType ===
                                        "sms"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    SMS
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentType(
                                            "resource"
                                        )
                                    }
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                        contentType ===
                                        "resource"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    Resources
                                </button>

                            </div>

                        </div>


                        {/* COUNT */}

                        <div className="text-sm text-gray-500">

                            <span className="font-semibold text-gray-900">

                                {searching
                                    ? "..."
                                    : totalResults}

                            </span>{" "}

                            {searching
                                ? "searching"
                                : totalResults ===
                                    1
                                    ? "result"
                                    : "results"}

                        </div>

                    </section>


                    {/* CONTENT */}

                    {loading && showSms ? (

                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
                            Loading messages...
                        </div>

                    ) : searching ? (

                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

                            <div className="mb-4 text-4xl">
                                ✨
                            </div>

                            <h2 className="mb-2 text-xl font-semibold text-gray-900">
                                Finding relevant resources
                            </h2>

                            <p className="text-sm text-gray-500">
                                Searching your resources using semantic matching...
                            </p>

                        </div>

                    ) : totalResults === 0 ? (

                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

                            <div className="mb-4 text-4xl">
                                ✉
                            </div>

                            <h2 className="mb-2 text-xl font-semibold text-gray-900">
                                No resources found
                            </h2>

                            <p className="text-sm text-gray-500">
                                Try changing your search or filters.
                            </p>

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                            {/* SMS */}

                            {showSms &&
                                displayedMessages.map(
                                    (message) => (

                                        <SmsCard
                                            key={`sms-${message.id}`}
                                            message={message}
                                        />

                                    )
                                )}


                            {/* RESOURCES */}

                            {showResources &&
                                displayedResources.map(
                                    (resource) => (

                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                        />

                                    )
                                )}

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}


export default Sms;
