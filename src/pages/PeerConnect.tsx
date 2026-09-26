import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";


// ============================================================
// TYPES
// ============================================================

type UserRole = "hcp" | "pharma";

type ViewMode = "chats" | "requests";

type CurrentUserProfile = {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    specialty?: string;
    location?: string;
    about?: string;
};

type PeerDoctor = {
    id: string;
    name: string;
    email?: string;
    specialty: string;
    location: string;
    about: string;
    role?: "hcp";
    verified?: boolean;
};

type PeerRequest = {
    id: string;

    fromUserId: string;
    fromUserName: string;

    toUserId: string;
    toUserName?: string;

    specialty: string;
    location: string;
    about?: string;

    title: string;
    question: string;
    topics: string[];

    status:
        | "pending"
        | "accepted"
        | "rejected";

    createdAt?: string;
};

type PeerMessage = {
    id: string;

    senderId: string;
    senderName?: string;

    text: string;

    createdAt?: string;
};

type PeerConversation = {
    id: string;

    doctorId: string;
    doctorName: string;

    specialty: string;
    location: string;

    title: string;
    originalQuestion: string;

    messages: PeerMessage[];

    createdAt?: string;
};


// ============================================================
// API CONFIG
// ============================================================

const API_BASE_URL = "http://localhost:8000";


// ============================================================
// AUTH / API HELPERS
// ============================================================

async function getFirebaseToken(): Promise<string> {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
        throw new Error("You are not signed in.");
    }

    return firebaseUser.getIdToken();
}


async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getFirebaseToken();

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        }
    );

    let data: any = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        let errorMessage = "Something went wrong.";

        if (typeof data?.detail === "string") {
            errorMessage = data.detail;
        } else if (Array.isArray(data?.detail)) {
            errorMessage = data.detail
                .map((item: any) => {
                    const field =
                        Array.isArray(item?.loc)
                            ? item.loc.join(".")
                            : "field";

                    return `${field}: ${
                        item?.msg || "Invalid value"
                    }`;
                })
                .join(" | ");
        } else if (data?.message) {
            errorMessage = data.message;
        }

        throw new Error(errorMessage);
    }

    return data as T;
}


// ============================================================
// NORMALIZERS
// ============================================================

function normalizeDoctor(
    doctor: any
): PeerDoctor {
    return {
        id:
            doctor?.id ??
            doctor?.userId ??
            doctor?.user_id ??
            "",

        name:
            doctor?.name ??
            doctor?.userName ??
            doctor?.user_name ??
            "HCP",

        email:
            doctor?.email ??
            doctor?.userEmail ??
            doctor?.user_email,

        specialty:
            doctor?.specialty ??
            doctor?.fromSpecialty ??
            doctor?.from_specialty ??
            "",

        location:
            doctor?.location ??
            doctor?.fromLocation ??
            doctor?.from_location ??
            "",

        about:
            doctor?.about ??
            doctor?.profileAbout ??
            doctor?.profile_about ??
            "",

        role:
            doctor?.role === "hcp"
                ? "hcp"
                : undefined,

        verified:
            doctor?.verified,
    };
}


function normalizeRequest(
    request: any
): PeerRequest {
    return {
        id:
            request?.id ??
            request?.requestId ??
            request?.request_id ??
            "",

        fromUserId:
            request?.fromUserId ??
            request?.from_user_id ??
            request?.fromDoctorId ??
            request?.from_doctor_id ??
            "",

        fromUserName:
            request?.fromUserName ??
            request?.from_user_name ??
            request?.fromDoctorName ??
            request?.from_doctor_name ??
            "HCP",

        toUserId:
            request?.toUserId ??
            request?.to_user_id ??
            "",

        toUserName:
            request?.toUserName ??
            request?.to_user_name,

        specialty:
            request?.specialty ??
            request?.fromSpecialty ??
            request?.from_specialty ??
            "",

        location:
            request?.location ??
            request?.fromLocation ??
            request?.from_location ??
            "",

        about:
            request?.about ??
            request?.fromAbout ??
            request?.from_about,

        title:
            request?.title ??
            "Peer Discussion",

        question:
            request?.question ??
            "",

        topics:
            Array.isArray(request?.topics)
                ? request.topics
                : [],

        status:
            request?.status ??
            "pending",

        createdAt:
            request?.createdAt ??
            request?.created_at,
    };
}


function normalizeMessage(
    message: any
): PeerMessage {
    return {
        id:
            message?.id ??
            message?.messageId ??
            message?.message_id ??
            crypto.randomUUID(),

        senderId:
            message?.senderId ??
            message?.sender_id ??
            "",

        senderName:
            message?.senderName ??
            message?.sender_name,

        text:
            message?.text ??
            message?.message ??
            "",

        createdAt:
            message?.createdAt ??
            message?.created_at,
    };
}


function normalizeConversation(
    conversation: any
): PeerConversation {
    const messages =
        Array.isArray(conversation?.messages)
            ? conversation.messages.map(
                  normalizeMessage
              )
            : [];

    return {
        id:
            conversation?.id ??
            conversation?.conversationId ??
            conversation?.conversation_id ??
            "",

        doctorId:
            conversation?.doctorId ??
            conversation?.doctor_id ??
            conversation?.peerUserId ??
            conversation?.peer_user_id ??
            "",

        doctorName:
            conversation?.doctorName ??
            conversation?.doctor_name ??
            conversation?.peerUserName ??
            conversation?.peer_user_name ??
            "HCP",

        specialty:
            conversation?.specialty ??
            "",

        location:
            conversation?.location ??
            "",

        title:
            conversation?.title ??
            "Peer Discussion",

        originalQuestion:
            conversation?.originalQuestion ??
            conversation?.original_question ??
            conversation?.question ??
            "",

        messages,

        createdAt:
            conversation?.createdAt ??
            conversation?.created_at,
    };
}


// ============================================================
// COMPONENT
// ============================================================

export default function PeerConnect() {
    const [searchParams] = useSearchParams();


    // ========================================================
    // CURRENT USER
    // ========================================================

    const [
        currentUser,
        setCurrentUser,
    ] = useState<CurrentUserProfile | null>(null);

    const [
        loadingUser,
        setLoadingUser,
    ] = useState(true);


    // ========================================================
    // DATA
    // ========================================================

    const [
        conversations,
        setConversations,
    ] = useState<PeerConversation[]>([]);

    const [
        requests,
        setRequests,
    ] = useState<PeerRequest[]>([]);

    const [
        loadingData,
        setLoadingData,
    ] = useState(true);


    // ========================================================
    // UI
    // ========================================================

    const [
        viewMode,
        setViewMode,
    ] = useState<ViewMode>("chats");

    const [
        selectedConversationId,
        setSelectedConversationId,
    ] = useState<string | null>(null);

    const [
        selectedRequestId,
        setSelectedRequestId,
    ] = useState<string | null>(null);

    const [
        showNewQuestion,
        setShowNewQuestion,
    ] = useState(false);


    // ========================================================
    // QUESTION
    // ========================================================

    const [
        question,
        setQuestion,
    ] = useState("");

    const [
        recommendedDoctors,
        setRecommendedDoctors,
    ] = useState<PeerDoctor[]>([]);

    const [
        selectedDoctors,
        setSelectedDoctors,
    ] = useState<string[]>([]);

    const [
        findingPeers,
        setFindingPeers,
    ] = useState(false);

    const [
        sendingRequests,
        setSendingRequests,
    ] = useState(false);


    // ========================================================
    // ERROR
    // ========================================================

    const [
        peerError,
        setPeerError,
    ] = useState("");


    // ========================================================
    // CHAT
    // ========================================================

    const [
        message,
        setMessage,
    ] = useState("");

    const [
        sendingMessage,
        setSendingMessage,
    ] = useState(false);


    // ========================================================
    // LOAD CURRENT USER
    // ========================================================

    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (firebaseUser) => {
                    if (!firebaseUser) {
                        setCurrentUser(null);
                        setLoadingUser(false);
                        return;
                    }

                    try {
                        /*
                         * Firebase auth is authoritative for uid/email.
                         * Firestore is only used for optional profile data.
                         */

                        let profile: any = {};

                        try {
                            const profileRef =
                                doc(
                                    db,
                                    "users",
                                    firebaseUser.uid
                                );

                            const profileSnapshot =
                                await getDoc(
                                    profileRef
                                );

                            if (
                                profileSnapshot.exists()
                            ) {
                                profile =
                                    profileSnapshot.data();
                            }
                        } catch (profileError) {
                            console.warn(
                                "Unable to load Firestore profile. Continuing with Firebase user.",
                                profileError
                            );
                        }


                        const role =
                            profile?.role === "pharma"
                                ? "pharma"
                                : "hcp";


                        setCurrentUser({
                            uid:
                                firebaseUser.uid,

                            name:
                                profile?.name ||
                                firebaseUser.displayName ||
                                "User",

                            email:
                                profile?.email ||
                                firebaseUser.email ||
                                "",

                            role,

                            specialty:
                                profile?.specialty ||
                                "",

                            location:
                                profile?.location ||
                                "",

                            about:
                                profile?.about ||
                                "",
                        });
                    } catch (error) {
                        console.error(
                            "Failed to initialize user:",
                            error
                        );

                        setCurrentUser(null);
                    } finally {
                        setLoadingUser(false);
                    }
                }
            );

        return unsubscribe;
    }, []);


    // ========================================================
    // LOAD REQUESTS + CONVERSATIONS
    // ========================================================

    const loadPeerData =
    useCallback(async () => {
        if (!auth.currentUser) {
            return null;
        }

        setLoadingData(true);

        try {
            const [
                requestsResponse,
                conversationsResponse,
            ] = await Promise.all([
                apiRequest<any>(
                    "/peer-connect/requests"
                ),

                apiRequest<any>(
                    "/peer-connect/conversations"
                ),
            ]);

            const rawRequests =
                Array.isArray(
                    requestsResponse?.requests
                )
                    ? requestsResponse.requests
                    : [];

            const rawConversations =
                Array.isArray(
                    conversationsResponse?.conversations
                )
                    ? conversationsResponse.conversations
                    : [];

            const normalizedRequests =
                rawRequests.map(
                    normalizeRequest
                );

            const normalizedConversations =
                rawConversations.map(
                    normalizeConversation
                );

            setRequests(
                normalizedRequests
            );

            setConversations(
                normalizedConversations
            );

            return normalizedConversations;

        } catch (error) {
            console.error(
                "Failed to load Peer Connect data:",
                error
            );

            setPeerError(
                error instanceof Error
                    ? error.message
                    : "Unable to load Peer Connect."
            );

            return null;

        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (
            !loadingUser &&
            currentUser
        ) {
            loadPeerData();
        }
    }, [
        loadingUser,
        currentUser,
        loadPeerData,
    ]);


    // ========================================================
    // OPEN QUESTION FROM DASHBOARD
    // ========================================================

    useEffect(() => {
        const questionFromDashboard =
            searchParams.get("question");

        if (!questionFromDashboard) {
            return;
        }

        setQuestion(
            questionFromDashboard
        );

        setShowNewQuestion(true);
    }, [searchParams]);


    // ========================================================
    // DERIVED DATA
    // ========================================================

    const pendingRequests =
        useMemo(
            () =>
                requests.filter(
                    (request) =>
                        request.status ===
                        "pending"
                ),
            [requests]
        );


    const selectedConversation =
        conversations.find(
            (conversation) =>
                conversation.id ===
                selectedConversationId
        );


    const selectedRequest =
        requests.find(
            (request) =>
                request.id ===
                selectedRequestId
        );


    // ========================================================
    // FIND RELEVANT PEERS
    // ========================================================

    async function handleFindPeers() {
        const trimmedQuestion =
            question.trim();

        if (!trimmedQuestion) {
            setPeerError(
                "Please enter a clinical question."
            );

            return;
        }

        if (!currentUser) {
            setPeerError(
                "Your profile is still loading."
            );

            return;
        }

        setFindingPeers(true);
        setPeerError("");
        setRecommendedDoctors([]);
        setSelectedDoctors([]);

        try {
            const response =
                await apiRequest<any>(
                    "/peer-connect/find-relevant-peers",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            question:
                                trimmedQuestion,
                        }),
                    }
                );


            const rawMatches =
                Array.isArray(
                    response?.matches
                )
                    ? response.matches
                    : Array.isArray(
                          response?.doctors
                      )
                    ? response.doctors
                    : Array.isArray(
                          response?.peers
                      )
                    ? response.peers
                    : [];


            const normalized =
                rawMatches
                    .map(normalizeDoctor)
                    .filter(
                        (doctor) =>
                            Boolean(
                                doctor.id
                            )
                    );


            setRecommendedDoctors(
                normalized
            );

        } catch (error) {
            console.error(
                "Peer matching failed:",
                error
            );

            setPeerError(
                error instanceof Error
                    ? error.message
                    : "Unable to find relevant peers."
            );
        } finally {
            setFindingPeers(false);
        }
    }


    // ========================================================
    // SELECT DOCTOR
    // ========================================================

    function toggleDoctor(
        doctorId: string
    ) {
        setSelectedDoctors(
            (current) => {
                if (
                    current.includes(
                        doctorId
                    )
                ) {
                    return current.filter(
                        (id) =>
                            id !== doctorId
                    );
                }

                if (
                    current.length >= 2
                ) {
                    return current;
                }

                return [
                    ...current,
                    doctorId,
                ];
            }
        );
    }


    // ========================================================
    // SEND REQUESTS
    // ========================================================

    async function handleSendRequests() {
        const trimmedQuestion =
            question.trim();

        if (
            selectedDoctors.length === 0
        ) {
            setPeerError(
                "Please select at least one HCP."
            );

            return;
        }

        if (!trimmedQuestion) {
            setPeerError(
                "Please enter a question."
            );

            return;
        }

        if (!auth.currentUser) {
            setPeerError(
                "You are not signed in."
            );

            return;
        }

        if (sendingRequests) {
            return;
        }


        setSendingRequests(true);
        setPeerError("");


        try {
            /*
             * The matching endpoint may return title/topics,
             * but those are optional for sending.
             *
             * We derive a safe title directly from the question
             * instead of referencing the old undefined
             * `questionAnalysis` variable.
             */

            const title =
                trimmedQuestion.length >
                80
                    ? `${trimmedQuestion.slice(
                          0,
                          77
                      )}...`
                    : trimmedQuestion;


            /*
             * Send one request per selected HCP.
             *
             * IMPORTANT:
             * The backend API uses snake_case field names.
             */

            for (
                const doctorId of
                    selectedDoctors
            ) {
                await apiRequest<any>(
                    "/peer-connect/requests",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            toUserId:
                                doctorId,

                            question:
                                trimmedQuestion,

                            title,

                            topics: [],
                        }),
                    }
                );
            }


            /*
             * Refresh everything from the API.
             */

            await loadPeerData();


            /*
             * Reset modal.
             */

            setShowNewQuestion(false);

            setQuestion("");

            setRecommendedDoctors([]);

            setSelectedDoctors([]);

            setPeerError("");

            setViewMode("chats");

        } catch (error) {
            console.error(
                "Failed to send peer request:",
                error
            );

            setPeerError(
                error instanceof Error
                    ? error.message
                    : "Unable to send peer request."
            );
        } finally {
            setSendingRequests(false);
        }
    }


    // ========================================================
    // ACCEPT REQUEST
    // ========================================================

   async function handleAcceptRequest(
    request: PeerRequest
) {
    try {
        setPeerError("");

        await apiRequest<any>(
            `/peer-connect/requests/${request.id}/accept`,
            {
                method: "POST",
            }
        );

        const updatedConversations =
            await loadPeerData();

        setSelectedRequestId(null);
        setViewMode("chats");

        if (
            updatedConversations &&
            updatedConversations.length > 0
        ) {
            const newConversation =
                updatedConversations.find(
                    (conversation) =>
                        conversation.originalQuestion ===
                        request.question
                );

            if (newConversation) {
                setSelectedConversationId(
                    newConversation.id
                );
            }
        }

    } catch (error) {
        console.error(
            "Failed to accept request:",
            error
        );

        setPeerError(
            error instanceof Error
                ? error.message
                : "Unable to accept request."
        );
    }
}

    // ========================================================
    // REJECT REQUEST
    // ========================================================

    async function handleRejectRequest(
        requestId: string
    ) {
        try {
            setPeerError("");

            await apiRequest(
                `/peer-connect/requests/${requestId}/reject`,
                {
                    method: "POST",
                }
            );


            setRequests(
                (current) =>
                    current.map(
                        (request) =>
                            request.id ===
                            requestId
                                ? {
                                      ...request,
                                      status:
                                          "rejected",
                                  }
                                : request
                    )
            );


            setSelectedRequestId(null);

        } catch (error) {
            console.error(
                "Failed to reject request:",
                error
            );

            setPeerError(
                error instanceof Error
                    ? error.message
                    : "Unable to reject request."
            );
        }
    }


    // ========================================================
    // SEND MESSAGE
    // ========================================================

    async function handleSendMessage() {
        if (
            !message.trim() ||
            !selectedConversationId ||
            sendingMessage
        ) {
            return;
        }


        const text =
            message.trim();


        setSendingMessage(true);
        setMessage("");


        try {
            const response =
                await apiRequest<any>(
                    `/peer-connect/conversations/${selectedConversationId}/messages`,
                    {
                        method: "POST",

                        body: JSON.stringify({
                            text,
                        }),
                    }
                );


            if (!response?.message) {
                throw new Error(
                    "Message was sent but the server did not return the message."
                );
            }


            const normalizedMessage =
                normalizeMessage(
                    response.message
                );


            setConversations(
                (current) =>
                    current.map(
                        (conversation) => {
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
                                    normalizedMessage,
                                ],
                            };
                        }
                    )
            );

        } catch (error) {
            console.error(
                "Failed to send message:",
                error
            );

            setMessage(text);

            setPeerError(
                error instanceof Error
                    ? error.message
                    : "Unable to send message."
            );
        } finally {
            setSendingMessage(false);
        }
    }


    // ========================================================
    // CLOSE QUESTION MODAL
    // ========================================================

    function closeQuestionModal() {
        if (sendingRequests) {
            return;
        }

        setShowNewQuestion(false);

        setQuestion("");

        setRecommendedDoctors([]);

        setSelectedDoctors([]);

        setPeerError("");
    }


    // ========================================================
    // LOADING
    // ========================================================

    if (loadingUser || loadingData) {
        return (
            <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50">
                <div className="text-sm text-gray-500">
                    Loading Peer Connect...
                </div>
            </div>
        );
    }


    // ========================================================
    // NOT SIGNED IN
    // ========================================================

    if (!currentUser) {
        return (
            <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Sign in required
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Please sign in to use Peer Connect.
                    </p>
                </div>
            </div>
        );
    }


    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="min-h-[calc(100vh-72px)] bg-gray-50">

            <div className="mx-auto flex h-[calc(100vh-72px)] max-w-[1500px] flex-col px-6 py-6">

                {/* HEADER */}

                <div className="mb-5">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Peer Connect
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Connect with relevant HCPs around
                        specific clinical questions.
                    </p>
                </div>


                {/* ERROR */}

                {peerError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                        {peerError}

                        <button
                            onClick={() =>
                                setPeerError("")
                            }
                            className="ml-3 font-semibold underline"
                        >
                            Dismiss
                        </button>

                    </div>
                )}


                <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                    {/* ==================================================
                        LEFT
                    ================================================== */}

                    <div className="flex w-[340px] shrink-0 flex-col border-r border-gray-200">

                        {/* TABS */}

                        <div className="flex border-b border-gray-200">

                            <button
                                onClick={() => {
                                    setViewMode(
                                        "chats"
                                    );

                                    setSelectedRequestId(
                                        null
                                    );
                                }}
                                className={`flex-1 px-5 py-4 text-sm font-semibold ${
                                    viewMode ===
                                    "chats"
                                        ? "border-b-2 border-gray-900 text-gray-900"
                                        : "text-gray-400"
                                }`}
                            >
                                Chats
                            </button>


                            <button
                                onClick={() => {
                                    setViewMode(
                                        "requests"
                                    );

                                    setSelectedConversationId(
                                        null
                                    );
                                }}
                                className={`flex-1 px-5 py-4 text-sm font-semibold ${
                                    viewMode ===
                                    "requests"
                                        ? "border-b-2 border-gray-900 text-gray-900"
                                        : "text-gray-400"
                                }`}
                            >
                                Requests

                                {pendingRequests.length >
                                    0 && (
                                    <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">
                                        {
                                            pendingRequests.length
                                        }
                                    </span>
                                )}
                            </button>

                        </div>


                        {/* LIST */}

                        <div className="min-h-0 flex-1 overflow-y-auto">

                            {viewMode ===
                            "chats" ? (
                                conversations.length >
                                0 ? (
                                    conversations.map(
                                        (
                                            conversation
                                        ) => (
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
                                                className={`w-full border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50 ${
                                                    selectedConversationId ===
                                                    conversation.id
                                                        ? "bg-gray-50"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">

                                                    <Avatar
                                                        name={
                                                            conversation.doctorName
                                                        }
                                                    />

                                                    <div className="min-w-0">

                                                        <p className="font-medium text-gray-900">
                                                            {
                                                                conversation.doctorName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-gray-400">
                                                            {
                                                                conversation.title
                                                            }
                                                        </p>

                                                    </div>

                                                </div>
                                            </button>
                                        )
                                    )
                                ) : (
                                    <EmptyList
                                        text="No conversations yet."
                                    />
                                )
                            ) : (
                                pendingRequests.length >
                                0 ? (
                                    pendingRequests.map(
                                        (
                                            request
                                        ) => (
                                            <button
                                                key={
                                                    request.id
                                                }
                                                onClick={() => {
                                                    setSelectedRequestId(
                                                        request.id
                                                    );

                                                    setSelectedConversationId(
                                                        null
                                                    );
                                                }}
                                                className={`w-full border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50 ${
                                                    selectedRequestId ===
                                                    request.id
                                                        ? "bg-gray-50"
                                                        : ""
                                                }`}
                                            >

                                                <div className="flex items-start gap-3">

                                                    <Avatar
                                                        name={
                                                            request.fromUserName
                                                        }
                                                    />

                                                    <div className="min-w-0">

                                                        <p className="font-medium text-gray-900">
                                                            {
                                                                request.fromUserName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-gray-400">
                                                            {
                                                                request.title
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </button>
                                        )
                                    )
                                ) : (
                                    <EmptyList
                                        text="No pending requests."
                                    />
                                )
                            )}

                        </div>


                        {/* NEW QUESTION */}

                        <div className="border-t border-gray-200 p-4">

                            <button
                                onClick={() =>
                                    setShowNewQuestion(
                                        true
                                    )
                                }
                                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                + New Question
                            </button>

                        </div>

                    </div>


                    {/* ==================================================
                        RIGHT
                    ================================================== */}

                    <div className="min-w-0 flex-1">

                        {viewMode ===
                            "chats" &&
                            selectedConversation && (
                                <ConversationPanel
                                    conversation={
                                        selectedConversation
                                    }
                                    currentUser={
                                        currentUser
                                    }
                                    message={
                                        message
                                    }
                                    setMessage={
                                        setMessage
                                    }
                                    sendingMessage={
                                        sendingMessage
                                    }
                                    onSendMessage={
                                        handleSendMessage
                                    }
                                />
                            )}


                        {viewMode ===
                            "requests" &&
                            selectedRequest && (
                                <RequestPanel
                                    request={
                                        selectedRequest
                                    }
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


            {/* ========================================================
                NEW QUESTION MODAL
            ======================================================== */}

            {showNewQuestion && (
                <NewQuestionModal
                    currentUser={
                        currentUser
                    }

                    question={
                        question
                    }

                    setQuestion={
                        setQuestion
                    }

                    recommendedDoctors={
                        recommendedDoctors
                    }

                    selectedDoctors={
                        selectedDoctors
                    }

                    findingPeers={
                        findingPeers
                    }

                    sendingRequests={
                        sendingRequests
                    }

                    peerError={
                        peerError
                    }

                    onClose={
                        closeQuestionModal
                    }

                    onFindPeers={
                        handleFindPeers
                    }

                    onToggleDoctor={
                        toggleDoctor
                    }

                    onSendRequests={
                        handleSendRequests
                    }
                />
            )}

        </div>
    );
}


// ============================================================
// AVATAR
// ============================================================

function Avatar({
    name,
}: {
    name: string;
}) {
    const initial =
        name
            ?.replace(
                /^Dr\.\s*/i,
                ""
            )
            ?.charAt(0)
            ?.toUpperCase() || "?";


    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
            {initial}
        </div>
    );
}


// ============================================================
// EMPTY LIST
// ============================================================

function EmptyList({
    text,
}: {
    text: string;
}) {
    return (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
            {text}
        </div>
    );
}


// ============================================================
// EMPTY PANEL
// ============================================================

function EmptyPanel({
    onNewQuestion,
}: {
    onNewQuestion: () => void;
}) {
    return (
        <div className="flex h-full items-center justify-center">

            <div className="max-w-md text-center">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    +
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                    Start a peer conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                    Ask a specific clinical question
                    and find relevant HCPs to discuss it with.
                </p>

                <button
                    onClick={onNewQuestion}
                    className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                    Ask a New Question
                </button>

            </div>

        </div>
    );
}


// ============================================================
// CONVERSATION PANEL
// ============================================================

function ConversationPanel({
    conversation,
    currentUser,
    message,
    setMessage,
    sendingMessage,
    onSendMessage,
}: {
    conversation: PeerConversation;

    currentUser:
        CurrentUserProfile;

    message: string;

    setMessage:
        (value: string) => void;

    sendingMessage:
        boolean;

    onSendMessage:
        () => void;
}) {
    return (
        <div className="flex h-full flex-col">

            {/* HEADER */}

            <div className="border-b border-gray-200 px-7 py-5">

                <div className="flex items-center gap-3">

                    <Avatar
                        name={
                            conversation.doctorName
                        }
                    />

                    <div>

                        <h2 className="font-semibold text-gray-900">
                            {
                                conversation.doctorName
                            }
                        </h2>

                        <p className="text-sm text-gray-400">
                            {
                                conversation.specialty
                            }{" "}
                            {conversation.specialty &&
                                conversation.location &&
                                " · "}
                            {
                                conversation.location
                            }
                        </p>

                    </div>

                </div>

            </div>


            {/* QUESTION */}

            <div className="border-b border-gray-100 bg-gray-50 px-7 py-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Original question
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-700">
                    {
                        conversation.originalQuestion
                    }
                </p>

            </div>


            {/* MESSAGES */}

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-7 py-6">

                {conversation.messages.map(
                    (item) => {
                        const isMe =
                            item.senderId ===
                            currentUser.uid;


                        return (
                            <div
                                key={
                                    item.id
                                }
                                className={`flex ${
                                    isMe
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >

                                <div className="max-w-[70%]">

                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                                            isMe
                                                ? "bg-gray-900 text-white"
                                                : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {
                                            item.text
                                        }
                                    </div>

                                    {item.createdAt && (
                                        <p className="mt-1 px-1 text-xs text-gray-400">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    )}

                                </div>

                            </div>
                        );
                    }
                )}


                {conversation.messages.length === 0 && (
                    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Request Accepted
                        </p>

                        <h3 className="mt-2 text-base font-semibold text-gray-900">
                            Your peer accepted your request
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Your original question is shown above.
                            Send a message below to start the discussion.
                        </p>
                    </div>
                )}


                {/* SUPPORT 
                
                <div className="rounded-2xl border border-gray-200 bg-white p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Impiricus Support
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                        Looking for additional information?
                        Relevant clinical, Medical Affairs,
                        and patient-support resources may be
                        available for this topic.
                    </p>

                    <div className="mt-3 flex gap-2">

                        <button className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
                            Clinical Resources
                        </button>

                        <button className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
                            Medical Affairs
                        </button>

                    </div>

                </div>
                */}

                

            </div>


            {/* INPUT */}

            <div className="border-t border-gray-200 p-5">

                <div className="flex items-center gap-3">

                    <input
                        value={
                            message
                        }
                        onChange={(
                            event
                        ) =>
                            setMessage(
                                event.target.value
                            )
                        }
                        onKeyDown={(
                            event
                        ) => {
                            if (
                                event.key ===
                                "Enter"
                            ) {
                                event.preventDefault();

                                onSendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={
                            sendingMessage
                        }
                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
                    />

                    <button
                        onClick={
                            onSendMessage
                        }
                        disabled={
                            !message.trim() ||
                            sendingMessage
                        }
                        className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {sendingMessage
                            ? "Sending..."
                            : "Send"}
                    </button>

                </div>

            </div>

        </div>
    );
}


// ============================================================
// REQUEST PANEL
// ============================================================

function RequestPanel({
    request,
    onAccept,
    onReject,
}: {
    request: PeerRequest;

    onAccept:
        (request: PeerRequest) => void;

    onReject:
        (requestId: string) => void;
}) {
    return (
        <div className="flex h-full items-center justify-center overflow-y-auto p-8">

            <div className="w-full max-w-2xl">

                <div className="flex items-center gap-4">

                    <Avatar
                        name={
                            request.fromUserName
                        }
                    />

                    <div>

                        <h2 className="text-2xl font-semibold text-gray-900">
                            {
                                request.fromUserName
                            }
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            {
                                request.specialty
                            }

                            {request.specialty &&
                                request.location &&
                                " · "}

                            {
                                request.location
                            }
                        </p>

                    </div>

                </div>


                {/* QUESTION */}

                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Wants to discuss
                    </p>

                    <h3 className="mt-2 text-xl font-semibold text-gray-900">
                        {
                            request.title
                        }
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-gray-600">
                        {
                            request.question
                        }
                    </p>


                    {request.topics?.length >
                        0 && (
                        <div className="mt-5 flex flex-wrap gap-2">

                            {request.topics.map(
                                (topic) => (
                                    <span
                                        key={
                                            topic
                                        }
                                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                                    >
                                        {
                                            topic
                                        }
                                    </span>
                                )
                            )}

                        </div>
                    )}

                </div>


                {/* PROFILE */}

                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Profile
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-gray-600">

                        {request.specialty && (
                            <p>
                                <span className="font-medium text-gray-900">
                                    Specialty:
                                </span>{" "}
                                {
                                    request.specialty
                                }
                            </p>
                        )}

                        {request.location && (
                            <p>
                                <span className="font-medium text-gray-900">
                                    Location:
                                </span>{" "}
                                {
                                    request.location
                                }
                            </p>
                        )}

                        {request.about && (
                            <p>
                                <span className="font-medium text-gray-900">
                                    About:
                                </span>{" "}
                                {
                                    request.about
                                }
                            </p>
                        )}

                    </div>

                </div>


                {/* BUTTONS */}

                <div className="mt-6 flex gap-3">

                    <button
                        onClick={() =>
                            onReject(
                                request.id
                            )
                        }
                        className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Reject
                    </button>

                    <button
                        onClick={() =>
                            onAccept(
                                request
                            )
                        }
                        className="flex-1 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Accept Request
                    </button>

                </div>

            </div>

        </div>
    );
}


// ============================================================
// NEW QUESTION MODAL
// ============================================================

function NewQuestionModal({
    currentUser,
    question,
    setQuestion,
    recommendedDoctors,
    selectedDoctors,
    findingPeers,
    sendingRequests,
    peerError,
    onClose,
    onFindPeers,
    onToggleDoctor,
    onSendRequests,
}: {
    currentUser:
        CurrentUserProfile;

    question:
        string;

    setQuestion:
        (value: string) => void;

    recommendedDoctors:
        PeerDoctor[];

    selectedDoctors:
        string[];

    findingPeers:
        boolean;

    sendingRequests:
        boolean;

    peerError:
        string;

    onClose:
        () => void;

    onFindPeers:
        () => void;

    onToggleDoctor:
        (doctorId: string) => void;

    onSendRequests:
        () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
            onClick={onClose}
        >

            <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                {/* HEADER */}

                <div className="flex items-start justify-between">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Peer Connect
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                            Ask Your Peers
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Describe what you want to discuss
                            and we'll find relevant HCPs.
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        disabled={
                            sendingRequests
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40"
                    >
                        ×
                    </button>

                </div>


                {/* CURRENT USER */}

                <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Your Profile
                    </p>

                    <div className="mt-3 flex gap-3">

                        <Avatar
                            name={
                                currentUser.name
                            }
                        />

                        <div>

                            <p className="font-medium text-gray-900">
                                {
                                    currentUser.name
                                }
                            </p>

                            <p className="text-sm text-gray-500">

                                {
                                    currentUser.specialty ||
                                    "Specialty not provided"
                                }

                                {" · "}

                                {
                                    currentUser.location ||
                                    "Location not provided"
                                }

                            </p>

                            {currentUser.about && (
                                <p className="mt-1 text-xs leading-5 text-gray-400">
                                    {
                                        currentUser.about
                                    }
                                </p>
                            )}

                        </div>

                    </div>

                </div>


                {/* QUESTION */}

                <div className="mt-6">

                    <label className="text-sm font-semibold text-gray-900">
                        What do you need help with?
                    </label>

                    <textarea
                        value={
                            question
                        }
                        onChange={(
                            event
                        ) =>
                            setQuestion(
                                event.target.value
                            )
                        }
                        placeholder="Describe your specific clinical question. Do not include patient-identifying information."
                        rows={5}
                        disabled={
                            sendingRequests
                        }
                        className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-6 outline-none focus:border-gray-400 disabled:bg-gray-50"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                        Please do not include patient names,
                        dates of birth, or other identifying
                        information.
                    </p>


                    {peerError && (
                        <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {
                                peerError
                            }
                        </div>
                    )}


                    <button
                        onClick={
                            onFindPeers
                        }
                        disabled={
                            !question.trim() ||
                            findingPeers ||
                            sendingRequests
                        }
                        className="mt-4 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {findingPeers
                            ? "Finding relevant peers..."
                            : "Find Relevant Peers"}
                    </button>

                </div>


                {/* RESULTS */}

                {recommendedDoctors.length >
                    0 && (
                    <div className="mt-7">

                        <div className="flex items-end justify-between">

                            <div>

                                <h3 className="font-semibold text-gray-900">
                                    Relevant HCPs
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Select up to 2 people to invite.
                                </p>

                            </div>

                            <p className="text-xs text-gray-400">
                                {
                                    selectedDoctors.length
                                }
                                /2 selected
                            </p>

                        </div>


                        <div className="mt-4 space-y-3">

                            {recommendedDoctors.map(
                                (
                                    doctor
                                ) => {

                                    const selected =
                                        selectedDoctors.includes(
                                            doctor.id
                                        );


                                    return (
                                        <button
                                            key={
                                                doctor.id
                                            }
                                            onClick={() =>
                                                onToggleDoctor(
                                                    doctor.id
                                                )
                                            }
                                            disabled={
                                                sendingRequests
                                            }
                                            className={`w-full rounded-2xl border p-4 text-left transition ${
                                                selected
                                                    ? "border-gray-900 bg-gray-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            } ${
                                                sendingRequests
                                                    ? "cursor-not-allowed opacity-60"
                                                    : ""
                                            }`}
                                        >

                                            <div className="flex items-start gap-4">

                                                <Avatar
                                                    name={
                                                        doctor.name
                                                    }
                                                />

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div>

                                                            <p className="font-medium text-gray-900">
                                                                {
                                                                    doctor.name
                                                                }
                                                            </p>

                                                            <p className="text-sm text-gray-400">

                                                                {
                                                                    doctor.specialty
                                                                }

                                                                {doctor.specialty &&
                                                                    doctor.location &&
                                                                    " · "}

                                                                {
                                                                    doctor.location
                                                                }

                                                            </p>

                                                        </div>


                                                        <div
                                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                                selected
                                                                    ? "border-gray-900 bg-gray-900 text-white"
                                                                    : "border-gray-300"
                                                            }`}
                                                        >
                                                            {selected &&
                                                                "✓"}
                                                        </div>

                                                    </div>


                                                    {doctor.about && (
                                                        <p className="mt-3 text-sm leading-6 text-gray-500">
                                                            {
                                                                doctor.about
                                                            }
                                                        </p>
                                                    )}

                                                </div>

                                            </div>

                                        </button>
                                    );
                                }
                            )}

                        </div>


                        {/* SEND */}

                        <button
                            onClick={
                                onSendRequests
                            }
                            disabled={
                                selectedDoctors.length ===
                                    0 ||
                                sendingRequests
                            }
                            className="mt-5 w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >

                            {sendingRequests
                                ? "Sending..."
                                : `Send ${
                                      selectedDoctors.length
                                  } Request${
                                      selectedDoctors.length ===
                                      1
                                          ? ""
                                          : "s"
                                  }`}

                        </button>

                    </div>
                )}


                {/* NO RESULTS */}

                {!findingPeers &&
                    question.trim() &&
                    recommendedDoctors.length ===
                        0 && (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">

                        <p className="text-sm font-medium text-gray-700">
                            No matching peers found yet.
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Try adding more clinical detail to your question.
                        </p>

                    </div>
                )}

            </div>

        </div>
    );
}
