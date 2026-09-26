import { useState } from "react";
import { useNavigate } from "react-router-dom";

import TrendChart from "../components/TrendChart";

const recommendedQuestions = [
    {
        category: "Based on your specialty",
        question:
            "What are emerging approaches to managing treatment-resistant hypertension?",
    },
    {
        category: "Based on your location",
        question:
            "What patient access challenges are other cardiologists discussing in Georgia?",
    },
    {
        category: "Based on your Pulse activity",
        question:
            "What are HCPs discussing about heart failure treatment sequencing?",
    },
];

function Dashboard() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [searchedQuestion, setSearchedQuestion] = useState("");

    const topicData = [
        {
            topic: "Hypertension",
            engagement: 82,
        },
        {
            topic: "Heart Failure",
            engagement: 68,
        },
        {
            topic: "ACE Inhibitors",
            engagement: 61,
        },
        {
            topic: "Clinical Trials",
            engagement: 42,
        },
    ];

    const engagementData = [
        {
            month: "Jun",
            engagement: 32,
        },
        {
            month: "Jul",
            engagement: 45,
        },
        {
            month: "Aug",
            engagement: 59,
        },
        {
            month: "Sep",
            engagement: 74,
        },
    ];

    function handleSearch() {
        if (!search.trim()) {
            return;
        }

        setSearchedQuestion(search.trim());
    }

    function handleDiscussion() {
        if (!searchedQuestion) {
            return;
        }

        navigate(
            `/app/discussion?search=${encodeURIComponent(
                searchedQuestion
            )}`
        );
    }

    function handlePeerConnect() {
        if (!searchedQuestion) {
            return;
        }

        navigate(
            `/app/peer-connect?question=${encodeURIComponent(
                searchedQuestion
            )}`
        );
    }

    function handleRecommendedQuestion(question: string) {
        setSearch(question);
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-gray-50">
            <div className="mx-auto max-w-6xl px-6 py-10">

                {/* HEADER */}
                <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                        Your HCP Workspace
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">
                        What can we help you explore?
                    </h1>
                </div>

                {/* RECOMMENDED QUESTIONS */}
                <div className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Questions you may want to explore
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Personalized based on your specialty,
                            location, and recent activity.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {recommendedQuestions.map((item) => (
                            <button
                                key={item.question}
                                onClick={() =>
                                    handleRecommendedQuestion(
                                        item.question
                                    )
                                }
                                className="rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-gray-300 hover:shadow-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    {item.category}
                                </p>

                                <p className="mt-3 text-sm font-medium leading-6 text-gray-800">
                                    {item.question}
                                </p>

                                <p className="mt-4 text-xs font-semibold text-gray-400">
                                    Use this question →
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEARCH */}
                <div className="mx-auto mt-8 max-w-4xl">
                    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="pl-3 text-gray-400">
                                🔍
                            </div>

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Ask a clinical or patient-care question..."
                                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
                            />

                            <button
                                onClick={handleSearch}
                                disabled={!search.trim()}
                                className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                {searchedQuestion && (
                    <div className="mt-10">

                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Explore your question
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Choose how you want to explore
                                what you are looking for.
                            </p>
                        </div>

                        {/* SEARCHED QUESTION */}
                        <div className="mb-5 rounded-2xl border border-gray-200 bg-white px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Your question
                            </p>

                            <p className="mt-2 text-sm font-medium text-gray-800">
                                {searchedQuestion}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                            {/* RESOURCES */}
                            <button
                                onClick={() =>
                                    console.log(
                                        "Resources:",
                                        searchedQuestion
                                    )
                                }
                                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                                    📚
                                </div>

                                <h3 className="mt-4 font-semibold text-gray-900">
                                    Resources
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Find relevant Impiricus
                                    resources and information
                                    for your question.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-gray-700">
                                    Explore resources →
                                </p>
                            </button>

                            {/* DISCUSSION */}
                            <button
                                onClick={handleDiscussion}
                                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                                    💬
                                </div>

                                <h3 className="mt-4 font-semibold text-gray-900">
                                    Discussion
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    See what other HCPs are
                                    discussing about this topic.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-gray-700">
                                    View discussions →
                                </p>
                            </button>

                            {/* PEER CONNECT */}
                            <button
                                onClick={handlePeerConnect}
                                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                                    👥
                                </div>

                                <h3 className="mt-4 font-semibold text-gray-900">
                                    Peer Connect
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Ask relevant HCPs directly
                                    about a specific question.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-gray-700">
                                    Ask your peers →
                                </p>
                            </button>

                            {/* MSL */}
                            <button
                                onClick={() =>
                                    console.log(
                                        "MSL:",
                                        searchedQuestion
                                    )
                                }
                                className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                                    🩺
                                </div>

                                <h3 className="mt-4 font-semibold text-gray-900">
                                    Talk to an MSL
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Connect with a Medical
                                    Science Liaison for a
                                    direct conversation.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-gray-700">
                                    Connect with an MSL →
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* SPECIALTY PULSE GRAPHS */}
                <section className="mt-10">
                    <div className="mb-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Your Specialty Pulse
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                            Cardiology
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            See the topics you're engaging with
                            and how your activity has changed over
                            time.
                        </p>
                    </div>

                    <TrendChart
                        topicData={topicData}
                        engagementData={engagementData}
                    />
                </section>

            </div>
        </div>
    );
}

export default Dashboard;