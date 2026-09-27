import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useSearchParams,
} from "react-router-dom";

import type {
    PeerConversation,
    PeerDoctor,
    PeerRequest,
} from "../types";

import {
    sampleConversations,
    sampleDoctors,
    sampleRequests,
} from "../data/peerConnectData";

type ViewMode = "chats" | "requests";

type QuestionAnalysis = {
    title: string;
    topics: string[];
};

function analyzeQuestion(question: string): QuestionAnalysis {
    const lowerQuestion = question.toLowerCase();

    const topics: string[] = [];

    if (
        lowerQuestion.includes("heart failure") ||
        lowerQuestion.includes("cardiac")
    ) {
        topics.push("Heart Failure");
    }

    if (
        lowerQuestion.includes("hypertension") ||
        lowerQuestion.includes("blood pressure")
    ) {
        topics.push("Hypertension");
    }

    if (
        lowerQuestion.includes("access") ||
        lowerQuestion.includes("insurance") ||
        lowerQuestion.includes("coverage") ||
        lowerQuestion.includes("prior authorization")
    ) {
        topics.push("Patient Access");
    }

    if (
        lowerQuestion.includes("medication") ||
        lowerQuestion.includes("drug") ||
        lowerQuestion.includes("treatment")
    ) {
        topics.push("Medication");
    }

    if (topics.length === 0) {
        topics.push("Clinical Discussion");
    }

    let title = "Clinical Discussion";

    if (
        topics.includes("Heart Failure") &&
        topics.includes("Patient Access")
    ) {
        title = "Heart Failure Medication Access";
    } else if (topics.includes("Heart Failure")) {
        title = "Heart Failure Discussion";
    } else if (topics.includes("Hypertension")) {
        title = "Hypertension Treatment";
    } else if (topics.includes("Patient Access")) {
        title = "Patient Access Discussion";
    }

    return {
        title,
        topics,
    };
}

function getRecommendedDoctors(
    question: string,
    currentUserSpecialty: string,
    currentUserLocation: string,
): PeerDoctor[] {
    const analysis = analyzeQuestion(question);

    const scoredDoctors = sampleDoctors.map((doctor) => {
        let score = 0;

        if (
            doctor.specialty.toLowerCase() ===
            currentUserSpecialty.toLowerCase()
        ) {
            score += 5;
        }

        if (
            doctor.location.toLowerCase() ===
            currentUserLocation.toLowerCase()
        ) {
            score += 3;
        }

        doctor.interests.forEach((interest) => {
            analysis.topics.forEach((topic) => {
                if (
                    interest.toLowerCase().includes(
                        topic.toLowerCase()
                    ) ||
                    topic.toLowerCase().includes(
                        interest.toLowerCase()
                    )
                ) {
                    score += 4;
                }
            });
        });

        const questionWords = question
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 4);

        doctor.interests.forEach((interest) => {
            questionWords.forEach((word) => {
                if (
                    interest
                        .toLowerCase()
                        .includes(word)
                ) {
                    score += 1;
                }
            });
        });

        return {
            doctor,
            score,
        };
    });

    return scoredDoctors
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((entry) => entry.doctor);
}

function PeerConnect() {
    const [searchParams] = useSearchParams();

    const [viewMode, setViewMode] =
        useState<ViewMode>("chats");

    const [conversations, setConversations] =
        useState<PeerConversation[]>(sampleConversations);

    const [requests, setRequests] =
        useState<PeerRequest[]>(sampleRequests);

    const [selectedConversationId, setSelectedConversationId] =
        useState<string | null>(null);

    const [selectedRequestId, setSelectedRequestId] =
        useState<string | null>(null);

    const [showNewQuestion, setShowNewQuestion] =
        useState(false);

    const [question, setQuestion] = useState("");

    const [recommendedDoctors, setRecommendedDoctors] =
        useState<PeerDoctor[]>([]);

    const [selectedDoctors, setSelectedDoctors] =
        useState<string[]>([]);

    const [questionAnalysis, setQuestionAnalysis] =
        useState<QuestionAnalysis | null>(null);

    const [message, setMessage] = useState("");

    const currentUserSpecialty = "Cardiology";
    const currentUserLocation = "Atlanta, GA";

    /*
     * Open the New Question modal when a question
     * is passed from the Dashboard.
     */
    useEffect(() => {
        const questionFromDashboard =
            searchParams.get("question");

        if (!questionFromDashboard) {
            return;
        }

        setQuestion(questionFromDashboard);
        setShowNewQuestion(true);
    }, [searchParams]);

    const pendingRequests = useMemo(() => {
        return requests.filter(
            (request) => request.status === "pending"
        );
    }, [requests]);

    const selectedConversation = conversations.find(
        (conversation) =>
            conversation.id === selectedConversationId
    );

    const selectedRequest = requests.find(
        (request) => request.id === selectedRequestId
    );

    function handleFindPeers() {
        if (!question.trim()) {
            return;
        }

        const analysis = analyzeQuestion(question);

        const doctors = getRecommendedDoctors(
            question,
            currentUserSpecialty,
            currentUserLocation
        );

        setQuestionAnalysis(analysis);
        setRecommendedDoctors(doctors);
        setSelectedDoctors([]);
    }

    function toggleDoctor(doctorId: string) {
        setSelectedDoctors((current) => {
            if (current.includes(doctorId)) {
                return current.filter(
                    (id) => id !== doctorId
                );
            }

            if (current.length >= 3) {
                return current;
            }

            return [...current, doctorId];
        });
    }

    function handleSendRequests() {
        if (
            !questionAnalysis ||
            selectedDoctors.length === 0
        ) {
            return;
        }

        const newRequests: PeerRequest[] = [];

        selectedDoctors.forEach((doctorId) => {
            const doctor = sampleDoctors.find(
                (item) => item.id === doctorId
            );

            if (!doctor) {
                return;
            }

            newRequests.push({
                id: `sent-${Date.now()}-${doctor.id}`,
                fromDoctorId: "current-user",
                fromDoctorName: "You",
                specialty: doctor.specialty,
                location: doctor.location,
                title: questionAnalysis.title,
                question,
                topics: questionAnalysis.topics,
                status: "pending",
            });
        });

        setRequests((current) => [
            ...current,
            ...newRequests,
        ]);

        setShowNewQuestion(false);
        setQuestion("");
        setQuestionAnalysis(null);
        setRecommendedDoctors([]);
        setSelectedDoctors([]);
    }

    function handleAcceptRequest(request: PeerRequest) {
        const newConversation: PeerConversation = {
            id: `conversation-${Date.now()}`,
            doctorId: request.fromDoctorId,
            doctorName: request.fromDoctorName,
            specialty: request.specialty,
            location: request.location,
            title: request.title,
            originalQuestion: request.question,
            messages: [],
        };

        setConversations((current) => [
            ...current,
            newConversation,
        ]);

        setRequests((current) =>
            current.map((item) =>
                item.id === request.id
                    ? {
                          ...item,
                          status: "accepted",
                      }
                    : item
            )
        );

        setSelectedRequestId(null);
        setViewMode("chats");
        setSelectedConversationId(newConversation.id);
    }

    function handleRejectRequest(requestId: string) {
        setRequests((current) =>
            current.map((request) =>
                request.id === requestId
                    ? {
                          ...request,
                          status: "rejected",
                      }
                    : request
            )
        );

        setSelectedRequestId(null);
    }

    function handleSendMessage() {
        if (
            !message.trim() ||
            !selectedConversationId
        ) {
            return;
        }

        setConversations((current) =>
            current.map((conversation) => {
                if (
                    conversation.id !==
                    selectedConversationId
                ) {
                    return conversation;
                }

                return {
                    ...conversation,
                    messages: [
                        ...conversation.messages,
                        {
                            id: `message-${Date.now()}`,
                            sender: "me",
                            text: message,
                            timestamp: "Now",
                        },
                    ],
                };
            })
        );

        setMessage("");
    }

    function handleSelectChats() {
        setViewMode("chats");
        setSelectedRequestId(null);
    }

    function handleSelectRequests() {
        setViewMode("requests");
        setSelectedConversationId(null);
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-canvas">
            <div className="mx-auto flex h-[calc(100vh-72px)] max-w-[1500px] flex-col px-6 py-6">
                <div className="mb-5">
                    <h1 className="text-3xl font-semibold text-heading">
                        Peer Connect
                    </h1>

                    <p className="mt-1 text-sm text-muted">
                        Connect with relevant HCPs around
                        specific clinical questions.
                    </p>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                    {/* LEFT COLUMN */}
                    <div className="flex w-[340px] shrink-0 flex-col border-r border-line">
                        {/* TABS */}
                        <div className="flex border-b border-line">
                            <button
                                onClick={handleSelectChats}
                                className={`flex-1 px-5 py-4 text-sm font-semibold transition ${
                                    viewMode === "chats"
                                        ? "border-b-2 border-accent text-heading"
                                        : "text-muted hover:text-heading"
                                }`}
                            >
                                Chats
                            </button>

                            <button
                                onClick={handleSelectRequests}
                                className={`flex-1 px-5 py-4 text-sm font-semibold transition ${
                                    viewMode === "requests"
                                        ? "border-b-2 border-accent text-heading"
                                        : "text-muted hover:text-heading"
                                }`}
                            >
                                Requests

                                {pendingRequests.length > 0 && (
                                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-surface">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* LIST */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {viewMode === "chats" ? (
                                <>
                                    {conversations.map(
                                        (conversation) => (
                                            <button
                                                key={
                                                    conversation.id
                                                }
                                                onClick={() => {
                                                    setSelectedConversationId(
                                                        conversation.id
                                                    );
                                                    setSelectedRequestId(
                                                        null
                                                    );
                                                }}
                                                className={`w-full border-b border-line px-5 py-4 text-left transition hover:bg-canvas ${
                                                    selectedConversationId ===
                                                    conversation.id
                                                        ? "bg-mist"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-semibold text-heading">
                                                        {conversation.doctorName
                                                            .replace(
                                                                "Dr. ",
                                                                ""
                                                            )
                                                            .charAt(
                                                                0
                                                            )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-medium text-heading">
                                                            {
                                                                conversation.doctorName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-muted">
                                                            {
                                                                conversation.title
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    )}

                                    {conversations.length ===
                                        0 && (
                                        <div className="px-5 py-10 text-center text-sm text-muted">
                                            No conversations yet.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {pendingRequests.map(
                                        (request) => (
                                            <button
                                                key={request.id}
                                                onClick={() => {
                                                    setSelectedRequestId(
                                                        request.id
                                                    );
                                                    setSelectedConversationId(
                                                        null
                                                    );
                                                }}
                                                className={`w-full border-b border-line px-5 py-4 text-left transition hover:bg-canvas ${
                                                    selectedRequestId ===
                                                    request.id
                                                        ? "bg-mist"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-semibold text-heading">
                                                        {request.fromDoctorName
                                                            .replace(
                                                                "Dr. ",
                                                                ""
                                                            )
                                                            .charAt(
                                                                0
                                                            )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="font-medium text-heading">
                                                            {
                                                                request.fromDoctorName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-muted">
                                                            {
                                                                request.title
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    )}

                                    {pendingRequests.length ===
                                        0 && (
                                        <div className="px-5 py-10 text-center text-sm text-muted">
                                            No pending requests.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* NEW QUESTION */}
                        <div className="border-t border-line p-4">
                            <button
                                onClick={() =>
                                    setShowNewQuestion(true)
                                }
                                className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-surface transition hover:bg-heading"
                            >
                                + New Question
                            </button>
                        </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="min-w-0 flex-1">
                        {viewMode === "chats" &&
                            selectedConversation && (
                                <ConversationPanel
                                    conversation={
                                        selectedConversation
                                    }
                                    message={message}
                                    setMessage={setMessage}
                                    onSendMessage={
                                        handleSendMessage
                                    }
                                />
                            )}

                        {viewMode === "requests" &&
                            selectedRequest && (
                                <RequestPanel
                                    request={selectedRequest}
                                    onAccept={
                                        handleAcceptRequest
                                    }
                                    onReject={
                                        handleRejectRequest
                                    }
                                />
                            )}

                        {!selectedConversation &&
                            !selectedRequest && (
                                <EmptyPanel
                                    onNewQuestion={() =>
                                        setShowNewQuestion(
                                            true
                                        )
                                    }
                                />
                            )}
                    </div>
                </div>
            </div>

            {showNewQuestion && (
                <NewQuestionModal
                    question={question}
                    setQuestion={setQuestion}
                    questionAnalysis={questionAnalysis}
                    recommendedDoctors={
                        recommendedDoctors
                    }
                    selectedDoctors={selectedDoctors}
                    onClose={() => {
                        setShowNewQuestion(false);
                        setQuestion("");
                        setQuestionAnalysis(null);
                        setRecommendedDoctors([]);
                        setSelectedDoctors([]);
                    }}
                    onFindPeers={handleFindPeers}
                    onToggleDoctor={toggleDoctor}
                    onSendRequests={handleSendRequests}
                />
            )}
        </div>
    );
}

function EmptyPanel({
    onNewQuestion,
}: {
    onNewQuestion: () => void;
}) {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-mist text-2xl">
                    +
                </div>

                <h2 className="text-xl font-semibold text-heading">
                    Start a peer conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-heading">
                    Ask a specific clinical question and
                    find relevant HCPs to discuss it with.
                </p>

                <button
                    onClick={onNewQuestion}
                    className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface hover:bg-heading"
                >
                    Ask a New Question
                </button>
            </div>
        </div>
    );
}

function ConversationPanel({
    conversation,
    message,
    setMessage,
    onSendMessage,
}: {
    conversation: PeerConversation;
    message: string;
    setMessage: (value: string) => void;
    onSendMessage: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            {/* HEADER */}
            <div className="border-b border-line px-7 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mist font-semibold text-heading">
                        {conversation.doctorName
                            .replace("Dr. ", "")
                            .charAt(0)}
                    </div>

                    <div>
                        <h2 className="font-semibold text-heading">
                            {conversation.doctorName}
                        </h2>

                        <p className="text-sm text-muted">
                            {conversation.specialty} ·{" "}
                            {conversation.location}
                        </p>
                    </div>
                </div>
            </div>

            {/* ORIGINAL QUESTION */}
            <div className="border-b border-line bg-canvas px-7 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Original question
                </p>

                <p className="mt-1 text-sm leading-6 text-heading">
                    {conversation.originalQuestion}
                </p>
            </div>

            {/* MESSAGES */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-7 py-6">
                {conversation.messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.sender === "me"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[70%] ${
                                message.sender === "me"
                                    ? "items-end"
                                    : "items-start"
                            }`}
                        >
                            <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                                    message.sender === "me"
                                        ? "bg-ink text-surface"
                                        : "bg-mist text-heading"
                                }`}
                            >
                                {message.text}
                            </div>

                            <p className="mt-1 px-1 text-xs text-muted">
                                {message.timestamp}
                            </p>
                        </div>
                    </div>
                ))}

                <div className="rounded-2xl border border-line bg-canvas p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Impiricus Support
                    </p>

                    <p className="mt-1 text-sm leading-6 text-heading">
                        Looking for additional information?
                        Relevant clinical, Medical Affairs, and
                        patient-support resources may be available
                        for this topic.
                    </p>

                    <div className="mt-3 flex gap-2">
                        <button className="rounded-lg bg-canvas px-3 py-2 text-xs font-medium text-heading hover:bg-mist">
                            Clinical Resources
                        </button>

                        <button className="rounded-lg bg-canvas px-3 py-2 text-xs font-medium text-heading hover:bg-mist">
                            Medical Affairs
                        </button>
                    </div>
                </div>
            </div>

            {/* MESSAGE INPUT */}
            <div className="border-t border-line p-5">
                <div className="flex items-center gap-3">
                    <input
                        value={message}
                        onChange={(event) =>
                            setMessage(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                onSendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl border border-line bg-canvas px-4 py-3 text-sm outline-none transition focus:border-accent focus:bg-surface"
                    />

                    <button
                        onClick={onSendMessage}
                        className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface hover:bg-heading"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

function RequestPanel({
    request,
    onAccept,
    onReject,
}: {
    request: PeerRequest;
    onAccept: (request: PeerRequest) => void;
    onReject: (requestId: string) => void;
}) {
    return (
        <div className="flex h-full items-center justify-center overflow-y-auto p-8">
            <div className="w-full max-w-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-xl font-semibold text-heading">
                        {request.fromDoctorName
                            .replace("Dr. ", "")
                            .charAt(0)}
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold text-heading">
                            {request.fromDoctorName}
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            {request.specialty} ·{" "}
                            {request.location}
                        </p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-line bg-canvas p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Wants to discuss
                    </p>

                    <h3 className="mt-2 text-xl font-semibold text-heading">
                        {request.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-ink">
                        {request.question}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {request.topics.map((topic) => (
                            <span
                                key={topic}
                                className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-heading"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-line bg-surface p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Profile
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-ink">
                        <p>
                            <span className="font-medium text-heading">
                                Specialty:
                            </span>{" "}
                            {request.specialty}
                        </p>

                        <p>
                            <span className="font-medium text-heading">
                                Location:
                            </span>{" "}
                            {request.location}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() =>
                            onReject(request.id)
                        }
                        className="flex-1 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-heading hover:bg-canvas"
                    >
                        Reject
                    </button>

                    <button
                        onClick={() => onAccept(request)}
                        className="flex-1 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface hover:bg-heading"
                    >
                        Accept Request
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewQuestionModal({
    question,
    setQuestion,
    questionAnalysis,
    recommendedDoctors,
    selectedDoctors,
    onClose,
    onFindPeers,
    onToggleDoctor,
    onSendRequests,
}: {
    question: string;
    setQuestion: (value: string) => void;
    questionAnalysis: QuestionAnalysis | null;
    recommendedDoctors: PeerDoctor[];
    selectedDoctors: string[];
    onClose: () => void;
    onFindPeers: () => void;
    onToggleDoctor: (doctorId: string) => void;
    onSendRequests: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-surface p-8 shadow-2xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Peer Connect
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-heading">
                            Ask Your Peers
                        </h2>

                        <p className="mt-2 text-sm text-muted">
                            Describe what you want to discuss
                            and we'll find relevant HCPs.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-lg text-muted hover:bg-mist"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-7 rounded-2xl border border-line bg-canvas p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Your Profile
                    </p>

                    <div className="mt-3 flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-heading">
                            A
                        </div>

                        <div>
                            <p className="font-medium text-heading">
                                Your HCP Profile
                            </p>

                            <p className="text-sm text-muted">
                                Cardiology · Atlanta, GA
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="text-sm font-semibold text-heading">
                        What do you need help with?
                    </label>

                    <textarea
                        value={question}
                        onChange={(event) =>
                            setQuestion(
                                event.target.value
                            )
                        }
                        placeholder="Describe your specific clinical question. Do not include patient-identifying information."
                        rows={5}
                        className="mt-2 w-full resize-none rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 outline-none transition focus:border-accent focus:bg-surface"
                    />

                    <p className="mt-2 text-xs text-muted">
                        Please do not include patient names,
                        dates of birth, or other identifying
                        information.
                    </p>

                    <button
                        onClick={onFindPeers}
                        disabled={!question.trim()}
                        className="mt-4 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface transition hover:bg-heading disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Find Relevant Peers
                    </button>
                </div>

                {questionAnalysis && (
                    <div className="mt-7">
                        <div className="rounded-2xl border border-line bg-canvas p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                AI-generated discussion
                            </p>

                            <h3 className="mt-2 text-lg font-semibold text-heading">
                                {questionAnalysis.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {questionAnalysis.topics.map(
                                    (topic) => (
                                        <span
                                            key={topic}
                                            className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-heading"
                                        >
                                            {topic}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {recommendedDoctors.length > 0 && (
                    <div className="mt-7">
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="font-semibold text-heading">
                                    Relevant HCPs
                                </h3>

                                <p className="mt-1 text-sm text-muted">
                                    Select up to 3 people to
                                    invite.
                                </p>
                            </div>

                            <p className="text-xs text-muted">
                                {selectedDoctors.length}/3
                                selected
                            </p>
                        </div>

                        <div className="mt-4 space-y-3">
                            {recommendedDoctors.map(
                                (doctor) => {
                                    const selected =
                                        selectedDoctors.includes(
                                            doctor.id
                                        );

                                    return (
                                        <button
                                            key={doctor.id}
                                            onClick={() =>
                                                onToggleDoctor(
                                                    doctor.id
                                                )
                                            }
                                            className={`w-full rounded-2xl border p-4 text-left transition ${
                                                selected
                                                    ? "border-ink bg-mist"
                                                    : "border-line hover:border-mist"
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist font-semibold text-heading">
                                                    {doctor.name
                                                        .replace(
                                                            "Dr. ",
                                                            ""
                                                        )
                                                        .charAt(
                                                            0
                                                        )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-heading">
                                                                {
                                                                    doctor.name
                                                                }
                                                            </p>

                                                            <p className="text-sm text-muted">
                                                                {
                                                                    doctor.specialty
                                                                }{" "}
                                                                ·{" "}
                                                                {
                                                                    doctor.location
                                                                }
                                                            </p>
                                                        </div>

                                                        <div
                                                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                                                selected
                                                                    ? "border-ink bg-ink text-surface"
                                                                    : "border-muted"
                                                            }`}
                                                        >
                                                            {selected &&
                                                                "✓"}
                                                        </div>
                                                    </div>

                                                    <p className="mt-3 text-sm leading-6 text-heading">
                                                        {
                                                            doctor.bio
                                                        }
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {doctor.interests
                                                            .slice(
                                                                0,
                                                                3
                                                            )
                                                            .map(
                                                                (
                                                                    interest
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            interest
                                                                        }
                                                                        className="rounded-full bg-mist px-2.5 py-1 text-xs text-heading"
                                                                    >
                                                                        {
                                                                            interest
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <button
                            onClick={onSendRequests}
                            disabled={
                                selectedDoctors.length ===
                                0
                            }
                            className="mt-5 w-full rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-surface hover:bg-heading disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Send{" "}
                            {selectedDoctors.length > 0
                                ? `${selectedDoctors.length} `
                                : ""}
                            Request
                            {selectedDoctors.length === 1
                                ? ""
                                : "s"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PeerConnect;