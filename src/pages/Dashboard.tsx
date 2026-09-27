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

type MslMessage = {
    sender: "hcp" | "ascend";
    text: string;
};

function Dashboard() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [searchedQuestion, setSearchedQuestion] = useState("");
    const [showMslModal, setShowMslModal] = useState(false);
    const [mslMessage, setMslMessage] = useState("");

    const [mslMessages, setMslMessages] = useState<MslMessage[]>([
        {
            sender: "ascend",
            text:
                "Hi! I'm Ascend. I can help connect you with an MSL or help you find relevant medical information.",
        },
    ]);

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

    function handleResources() {
        navigate("/app/sms");
    }

    function handleMsl() {
        setShowMslModal(true);
    }

    function handleSendMslMessage() {
        if (!mslMessage.trim()) {
            return;
        }

        const newMessage: MslMessage = {
            sender: "hcp",
            text: mslMessage.trim(),
        };

        setMslMessages((currentMessages) => [
            ...currentMessages,
            newMessage,
        ]);

        setMslMessage("");
    }

    function handleQuickAction(action: string) {
        setMslMessages((currentMessages) => [
            ...currentMessages,
            {
                sender: "hcp",
                text: action,
            },
        ]);
    }

    function handleRecommendedQuestion(question: string) {
        setSearch(question);
    }

    function closeMslModal() {
        setShowMslModal(false);
        setMslMessage("");
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-canvas">
            <div className="mx-auto max-w-6xl px-6 py-10">

                {/* HEADER */}
                <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Your HCP Workspace
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-heading">
                        What can we help you explore?
                    </h1>
                </div>

                {/* RECOMMENDED QUESTIONS */}
                <div className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-heading">
                            Questions you may want to explore
                        </h2>

                        <p className="mt-1 text-sm text-muted">
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
                                className="rounded-2xl border border-line bg-surface p-5 text-left transition hover:border-mist hover:shadow-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    {item.category}
                                </p>

                                <p className="mt-3 text-sm font-medium leading-6 text-heading">
                                    {item.question}
                                </p>

                                <p className="mt-4 text-xs font-semibold text-muted">
                                    Use this question →
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEARCH */}
                <div className="mx-auto mt-8 max-w-4xl">
                    <div className="rounded-2xl border border-line bg-surface p-2 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="pl-3 text-muted">
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
                                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-heading outline-none placeholder:text-muted"
                            />

                            <button
                                onClick={handleSearch}
                                disabled={!search.trim()}
                                className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-surface transition hover:bg-heading disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                {searchedQuestion && (
                    <div className="mt-10 rounded-3xl border border-line bg-surface p-6 shadow-sm">

                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm text-surface">
                                    ✦
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-heading">
                                        What would you like to do?
                                    </h2>

                                    <p className="mt-0.5 text-sm text-muted">
                                        Choose how you'd like to explore your question.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                            {/* RESOURCES */}
                            <button
                                onClick={handleResources}
                                className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-mist hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-lg">
                                    📚
                                </div>

                                <h3 className="mt-4 font-semibold text-heading">
                                    Resources
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-heading">
                                    Find relevant Impiricus
                                    resources and information
                                    for your question.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-muted group-hover:text-heading">
                                    Explore resources →
                                </p>
                            </button>

                            {/* DISCUSSION */}
                            <button
                                onClick={handleDiscussion}
                                className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-mist hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-lg">
                                    💬
                                </div>

                                <h3 className="mt-4 font-semibold text-heading">
                                    Discussion
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-heading">
                                    See what other HCPs are
                                    discussing about this topic.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-muted group-hover:text-heading">
                                    View discussions →
                                </p>
                            </button>

                            {/* PEER CONNECT */}
                            <button
                                onClick={handlePeerConnect}
                                className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-mist hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-lg">
                                    👥
                                </div>

                                <h3 className="mt-4 font-semibold text-heading">
                                    Peer Connect
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-heading">
                                    Ask relevant HCPs directly
                                    about a specific question.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-muted group-hover:text-heading">
                                    Ask your peers →
                                </p>
                            </button>

                            {/* MSL */}
                            <button
                                onClick={handleMsl}
                                className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-mist hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canvas text-lg">
                                    🩺
                                </div>

                                <h3 className="mt-4 font-semibold text-heading">
                                    Talk to an MSL
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-heading">
                                    Connect with a Medical
                                    Science Liaison for a
                                    direct conversation.
                                </p>

                                <p className="mt-4 text-xs font-semibold text-muted group-hover:text-heading">
                                    Connect with an MSL →
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* SPECIALTY PULSE */}
                <section className="mt-10">
                    <div className="mb-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                            Your Specialty Pulse
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-heading">
                            Cardiology
                        </h2>

                        <p className="mt-2 text-sm text-muted">
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

            {/* MSL / ASCEND MODAL */}
            {showMslModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
                    <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between border-b border-line px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-lg text-surface">
                                    🩺
                                </div>

                                <div>
                                    <h2 className="font-semibold text-heading">
                                        Connect with an MSL
                                    </h2>

                                    <p className="text-xs text-muted">
                                        Powered by Ascend
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={closeMslModal}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted transition hover:bg-canvas hover:text-heading"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* CONVERSATION */}
                        <div className="flex-1 space-y-4 overflow-y-auto bg-mist px-6 py-6">

                            {/* CURRENT QUESTION */}
                            {searchedQuestion && (
                                <div className="rounded-2xl border border-line bg-canvas p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        Your question
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-heading">
                                        {searchedQuestion}
                                    </p>
                                </div>
                            )}

                            {mslMessages.map((message, index) => (
                                <div
                                    key={`${message.sender}-${index}`}
                                    className={
                                        message.sender === "hcp"
                                            ? "flex justify-end"
                                            : "flex justify-start"
                                    }
                                >
                                    <div
                                        className={
                                            message.sender === "hcp"
                                                ? "max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-sm leading-6 text-surface"
                                                : "max-w-[80%] rounded-2xl rounded-bl-md border border-line bg-canvas px-4 py-3 text-sm leading-6 text-heading"
                                        }
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            ))}

                            {/* QUICK ACTIONS */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Quick actions
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() =>
                                            handleQuickAction(
                                                "I'd like to request scientific information related to my question."
                                            )
                                        }
                                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-heading transition hover:border-mist"
                                    >
                                        Request scientific information
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleQuickAction(
                                                "I'd like to connect with an MSL who can discuss this topic."
                                            )
                                        }
                                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-heading transition hover:border-mist"
                                    >
                                        Connect with an MSL
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleQuickAction(
                                                "Can you help me find relevant patient resources?"
                                            )
                                        }
                                        className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-heading transition hover:border-mist"
                                    >
                                        Patient resources
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MESSAGE INPUT */}
                        <div className="border-t border-line bg-surface p-4">
                            <div className="flex items-end gap-3">
                                <textarea
                                    value={mslMessage}
                                    onChange={(event) =>
                                        setMslMessage(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            !event.shiftKey
                                        ) {
                                            event.preventDefault();
                                            handleSendMslMessage();
                                        }
                                    }}
                                    placeholder="Ask Ascend or request to connect with an MSL..."
                                    rows={2}
                                    className="min-h-[52px] flex-1 resize-none rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-heading outline-none transition focus:border-accent focus:bg-surface"
                                />

                                <button
                                    onClick={handleSendMslMessage}
                                    disabled={!mslMessage.trim()}
                                    className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-heading disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Send
                                </button>
                            </div>

                            <p className="mt-2 text-center text-[11px] text-muted">
                                Ascend connects HCPs with relevant
                                resources and field or medical
                                support.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;