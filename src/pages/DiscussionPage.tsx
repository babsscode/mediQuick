import { useEffect, useMemo, useState } from "react";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
} from "firebase/firestore";

import {
    onAuthStateChanged,
    type User,
} from "firebase/auth";

import { db } from "../firebase/firestore";
import { auth } from "../firebase/auth";

import type {
    Discussion,
    DiscussionMessage,
} from "../types";

import "../DiscussionPage.css";

/*
 * Change this to wherever your Python API is running.
 *
 * For example:
 *
 * VITE_API_URL=http://localhost:8000
 *
 * Then:
 *
 * POST http://localhost:8000/discussions/search
 */
const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";


interface AISearchResult {
    id: string;
    title: string;
    description: string;
    specialty: string;
    participantCount: number;
    popular: boolean;
    source?: string;
}


interface AISearchResponse {
    success: boolean;
    query: string;
    results: AISearchResult[];
    count: number;
}


function DiscussionPage() {
    const [user, setUser] =
        useState<User | null>(null);

    const [userRole, setUserRole] =
        useState<string>("hcp");

    const [discussions, setDiscussions] =
        useState<Discussion[]>([]);

    const [selectedDiscussion, setSelectedDiscussion] =
        useState<Discussion | null>(null);

    const [openedDiscussions, setOpenedDiscussions] =
        useState<Discussion[]>([]);

    const [messages, setMessages] =
        useState<DiscussionMessage[]>([]);

    const [search, setSearch] =
        useState("");

    const [aiResults, setAIResults] =
        useState<Discussion[]>([]);

    const [aiSearching, setAISearching] =
        useState(false);

    const [newMessage, setNewMessage] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);

    const [sendError, setSendError] =
        useState("");


    /*
     * Get currently signed-in user.
     */
    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (currentUser) => {
                    setUser(currentUser);

                    if (!currentUser) {
                        setUserRole("hcp");
                        return;
                    }

                    try {
                        const userRef =
                            doc(
                                db,
                                "users",
                                currentUser.uid
                            );

                        const userSnapshot =
                            await getDoc(userRef);

                        if (
                            userSnapshot.exists()
                        ) {
                            const userData =
                                userSnapshot.data();

                            if (
                                typeof userData.role ===
                                "string"
                            ) {
                                setUserRole(
                                    userData.role.toLowerCase()
                                );
                            } else {
                                setUserRole("hcp");
                            }
                        } else {
                            setUserRole("hcp");
                        }
                    } catch (error) {
                        console.error(
                            "Error loading user role:",
                            error
                        );

                        setUserRole("hcp");
                    }
                }
            );

        return () => unsubscribe();
    }, []);


    /*
     * Load all discussions from Firestore.
     */
    useEffect(() => {
        const discussionsRef =
            collection(
                db,
                "discussions"
            );

        const discussionsQuery =
            query(
                discussionsRef,
                orderBy(
                    "participantCount",
                    "desc"
                )
            );

        const unsubscribe =
            onSnapshot(
                discussionsQuery,
                (snapshot) => {
                    const loadedDiscussions: Discussion[] =
                        snapshot.docs.map(
                            (document) => {
                                const data =
                                    document.data();

                                return {
                                    id: document.id,

                                    title:
                                        typeof data.title ===
                                        "string"
                                            ? data.title
                                            : "",

                                    description:
                                        typeof data.description ===
                                        "string"
                                            ? data.description
                                            : "",

                                    specialty:
                                        typeof data.specialty ===
                                        "string"
                                            ? data.specialty
                                            : "",

                                    participantCount:
                                        typeof data.participantCount ===
                                        "number"
                                            ? data.participantCount
                                            : 0,

                                    popular:
                                        typeof data.popular ===
                                        "boolean"
                                            ? data.popular
                                            : false,

                                    /*
                                     * Your Discussion type requires
                                     * createdAt.
                                     */
                                    createdAt:
                                        data.createdAt instanceof
                                        Timestamp
                                            ? data.createdAt
                                            : Timestamp.now(),
                                };
                            }
                        );

                    setDiscussions(
                        loadedDiscussions
                    );

                    setLoading(false);

                    setSelectedDiscussion(
                        (current) => {
                            if (!current) {
                                const first =
                                    loadedDiscussions[0] ??
                                    null;

                                if (first) {
                                    setOpenedDiscussions(
                                        (opened) => {
                                            if (
                                                opened.some(
                                                    (item) =>
                                                        item.id ===
                                                        first.id
                                                )
                                            ) {
                                                return opened;
                                            }

                                            return [
                                                first,
                                                ...opened,
                                            ];
                                        }
                                    );
                                }

                                return first;
                            }

                            const updated =
                                loadedDiscussions.find(
                                    (item) =>
                                        item.id ===
                                        current.id
                                );

                            if (updated) {
                                setOpenedDiscussions(
                                    (opened) =>
                                        opened.map(
                                            (item) =>
                                                item.id ===
                                                updated.id
                                                    ? updated
                                                    : item
                                        )
                                );

                                return updated;
                            }

                            return (
                                loadedDiscussions[0] ??
                                null
                            );
                        }
                    );
                },
                (error) => {
                    console.error(
                        "Error loading discussions:",
                        error
                    );

                    setLoading(false);

                    setSendError(
                        `Unable to load discussions: ${error.message}`
                    );
                }
            );

        return () => unsubscribe();
    }, []);


    /*
     * Basic local search.
     *
     * This happens FIRST.
     *
     * We don't call the AI API if we have a
     * direct match.
     */
    const basicSearchResults =
        useMemo(() => {
            const searchText =
                search
                    .toLowerCase()
                    .trim();

            if (!searchText) {
                return discussions.filter(
                    (discussion) =>
                        discussion.popular
                );
            }

            return discussions.filter(
                (discussion) =>
                    discussion.title
                        .toLowerCase()
                        .includes(searchText) ||

                    discussion.description
                        .toLowerCase()
                        .includes(searchText) ||

                    discussion.specialty
                        .toLowerCase()
                        .includes(searchText)
            );
        }, [
            discussions,
            search,
        ]);


    /*
     * Convert the AI API result into our
     * local Discussion type.
     *
     * We find the real Firestore discussion
     * where possible so the rest of the page
     * behaves exactly the same.
     */
    const convertAIResultsToDiscussions = (
        results: AISearchResult[]
    ): Discussion[] => {
        return results
            .map((result) => {
                const existing =
                    discussions.find(
                        (discussion) =>
                            discussion.id ===
                            result.id
                    );

                /*
                 * Prefer the actual Firestore
                 * discussion.
                 */
                if (existing) {
                    return existing;
                }

                /*
                 * Fallback in case the API returned
                 * a discussion that wasn't in the
                 * local snapshot yet.
                 */
                return {
                    id: result.id,

                    title:
                        result.title ?? "",

                    description:
                        result.description ?? "",

                    specialty:
                        result.specialty ?? "",

                    participantCount:
                        result.participantCount ?? 0,

                    popular:
                        result.popular ?? false,

                    createdAt:
                        Timestamp.now(),
                };
            });
    };


    /*
     * AI SEARCH
     *
     * This runs ONLY when:
     *
     * 1. There is a search query.
     * 2. Basic search found nothing.
     *
     * The API performs the semantic/AI ranking.
     */
    useEffect(() => {
        const searchText =
            search.trim();

        /*
         * Don't call the API for an empty
         * search.
         */
        if (!searchText) {
            setAIResults([]);
            setAISearching(false);
            return;
        }

        /*
         * If normal search already found
         * discussions, there is no reason
         * to call the AI API.
         */
        if (
            basicSearchResults.length > 0
        ) {
            setAIResults([]);
            setAISearching(false);
            return;
        }

        let cancelled = false;

        /*
         * Small debounce so we don't call the
         * Python API on every keystroke.
         */
        const timeout = setTimeout(
            async () => {
                try {
                    setAISearching(true);
                    setSendError("");

                    /*
                     * Firebase ID token.
                     *
                     * Your Python endpoint calls:
                     *
                     * get_current_user(
                     *     authorization
                     * )
                     *
                     * so we send the Firebase
                     * bearer token.
                     */
                    const token =
                        await user?.getIdToken();

                    if (!token) {
                        setAIResults([]);
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/discussions/search`,
                            {
                                method: "POST",

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

                                        /*
                                         * Ask the AI endpoint
                                         * for a small number of
                                         * relevant discussions.
                                         */
                                        limit: 5,
                                    }),
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Search API returned ${response.status}`
                        );
                    }

                    const data =
                        (await response.json()) as AISearchResponse;

                    if (cancelled) {
                        return;
                    }

                    if (
                        !data.success ||
                        !Array.isArray(
                            data.results
                        )
                    ) {
                        setAIResults([]);
                        return;
                    }

                    const converted =
                        convertAIResultsToDiscussions(
                            data.results
                        );

                    setAIResults(
                        converted
                    );
                } catch (error) {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    console.error(
                        "AI discussion search failed:",
                        error
                    );

                    setAIResults([]);

                    /*
                     * Don't replace the entire page
                     * with an error. Basic search has
                     * already failed, so simply tell
                     * the user that AI search wasn't
                     * available.
                     */
                    setSendError(
                        "AI discussion search is temporarily unavailable."
                    );
                } finally {
                    if (!cancelled) {
                        setAISearching(
                            false
                        );
                    }
                }
            },
            500
        );

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [
        search,
        basicSearchResults.length,
        user,
        discussions,
    ]);


    /*
     * Determine what should appear in the
     * sidebar.
     *
     * Basic results take priority.
     * AI results are only used when there
     * are no direct matches.
     */
    const searchResults =
        useMemo(() => {
            if (!search.trim()) {
                return basicSearchResults;
            }

            if (
                basicSearchResults.length > 0
            ) {
                return basicSearchResults;
            }

            return aiResults;
        }, [
            search,
            basicSearchResults,
            aiResults,
        ]);


    /*
     * Sidebar discussions.
     */
    const sidebarDiscussions =
        useMemo(() => {
            const combined: Discussion[] =
                [];

            /*
             * If searching, show the search
             * results.
             */
            if (search.trim()) {
                return searchResults;
            }

            /*
             * Otherwise show opened discussions
             * first.
             */
            openedDiscussions.forEach(
                (opened) => {
                    const latest =
                        discussions.find(
                            (discussion) =>
                                discussion.id ===
                                opened.id
                        );

                    if (
                        latest &&
                        !combined.some(
                            (item) =>
                                item.id ===
                                latest.id
                        )
                    ) {
                        combined.push(
                            latest
                        );
                    }
                }
            );

            /*
             * Then add popular discussions.
             */
            basicSearchResults.forEach(
                (discussion) => {
                    if (
                        !combined.some(
                            (item) =>
                                item.id ===
                                discussion.id
                        )
                    ) {
                        combined.push(
                            discussion
                        );
                    }
                }
            );

            return combined;
        }, [
            search,
            searchResults,
            openedDiscussions,
            discussions,
            basicSearchResults,
        ]);


    /*
     * Select a discussion.
     */
    const selectDiscussion = (
        discussion: Discussion
    ) => {
        setSelectedDiscussion(
            discussion
        );

        setOpenedDiscussions(
            (currentOpened) => {
                const alreadyOpen =
                    currentOpened.some(
                        (item) =>
                            item.id ===
                            discussion.id
                    );

                if (alreadyOpen) {
                    return currentOpened;
                }

                return [
                    ...currentOpened,
                    discussion,
                ];
            }
        );

        setSendError("");
    };


    /*
     * Load messages for selected discussion.
     */
    useEffect(() => {
        if (!selectedDiscussion) {
            setMessages([]);
            return;
        }

        setSendError("");

        const messagesRef =
            collection(
                db,
                "discussions",
                selectedDiscussion.id,
                "messages"
            );

        const unsubscribe =
            onSnapshot(
                messagesRef,
                (snapshot) => {
                    const loadedMessages =
                        snapshot.docs.map(
                            (document) => ({
                                id: document.id,
                                ...document.data(),
                            })
                        ) as DiscussionMessage[];

                    const sortedMessages =
                        [...loadedMessages].sort(
                            (a, b) => {
                                const aTime =
                                    getMessageTime(
                                        a
                                    );

                                const bTime =
                                    getMessageTime(
                                        b
                                    );

                                if (
                                    aTime ===
                                        null &&
                                    bTime ===
                                        null
                                ) {
                                    return 0;
                                }

                                if (
                                    aTime ===
                                    null
                                ) {
                                    return -1;
                                }

                                if (
                                    bTime ===
                                    null
                                ) {
                                    return 1;
                                }

                                return (
                                    aTime -
                                    bTime
                                );
                            }
                        );

                    setMessages(
                        sortedMessages
                    );
                },
                (error) => {
                    console.error(
                        "Error loading messages:",
                        error
                    );

                    setSendError(
                        `Unable to load messages: ${error.message}`
                    );
                }
            );

        return () => unsubscribe();
    }, [selectedDiscussion]);


    /*
     * Send HCP message.
     */
    const sendMessage = async () => {
        if (
            !user ||
            !selectedDiscussion ||
            !newMessage.trim() ||
            sending
        ) {
            return;
        }

        setSending(true);
        setSendError("");

        try {
            const messagesRef =
                collection(
                    db,
                    "discussions",
                    selectedDiscussion.id,
                    "messages"
                );

            await addDoc(
                messagesRef,
                {
                    authorId:
                        user.uid,

                    text:
                        newMessage.trim(),

                    role:
                        "hcp",

                    anonymousName:
                        "Anonymous HCP",

                    verified:
                        true,

                    parentMessageId:
                        null,

                    createdAt:
                        Timestamp.now(),
                }
            );

            setNewMessage("");
        } catch (error) {
            console.error(
                "Error sending message:",
                error
            );

            setSendError(
                error instanceof Error
                    ? `Message could not be sent: ${error.message}`
                    : "Message could not be sent. Please try again."
            );
        } finally {
            setSending(false);
        }
    };


    /*
     * Send Pharma response.
     */
    const sendPharmaReply = async (
        parentMessageId: string,
        text: string
    ) => {
        if (
            !user ||
            userRole !== "pharma" ||
            !selectedDiscussion ||
            !text.trim()
        ) {
            return;
        }

        try {
            setSendError("");

            const messagesRef =
                collection(
                    db,
                    "discussions",
                    selectedDiscussion.id,
                    "messages"
                );

            await addDoc(
                messagesRef,
                {
                    authorId:
                        user.uid,

                    text:
                        text.trim(),

                    role:
                        "pharma",

                    anonymousName:
                        "Verified Pharma Representative",

                    company:
                        "Example Pharma",

                    verified:
                        true,

                    parentMessageId,

                    createdAt:
                        Timestamp.now(),
                }
            );
        } catch (error) {
            console.error(
                "Error sending pharma reply:",
                error
            );

            setSendError(
                error instanceof Error
                    ? `Response could not be sent: ${error.message}`
                    : "Response could not be sent. Please try again."
            );

            throw error;
        }
    };


    if (loading) {
        return (
            <div className="discussion-loading">
                Loading discussions...
            </div>
        );
    }


    if (!user) {
        return (
            <div className="discussion-loading">
                Please sign in to view discussions.
            </div>
        );
    }


    return (
        <div className="discussion-page">
            <aside className="discussion-sidebar">
                <div className="discussion-sidebar-header">
                    <h1>
                        Discussions
                    </h1>

                    <p>
                        Learn from verified HCP
                        perspectives
                    </p>
                </div>


                {/* SEARCH */}
                <div className="discussion-search">
                    <span>
                        ⌕
                    </span>

                    <input
                        type="search"
                        placeholder="Search discussions..."
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
                            className="search-clear"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>


                <div className="discussion-list">
                    <div className="section-label">
                        {search.trim()
                            ? basicSearchResults.length >
                              0
                                ? "SEARCH RESULTS"
                                : "AI SUGGESTIONS"
                            : "DISCUSSIONS"}
                    </div>


                    {aiSearching &&
                        basicSearchResults.length ===
                            0 && (
                            <div className="ai-searching">
                                Finding relevant
                                discussions...
                            </div>
                        )}


                    {!aiSearching &&
                        sidebarDiscussions.length ===
                            0 && (
                            <div className="no-results">
                                {search.trim()
                                    ? `No relevant discussions found for "${search}".`
                                    : "No discussions found."}
                            </div>
                        )}


                    {sidebarDiscussions.map(
                        (discussion) => (
                            <button
                                key={
                                    discussion.id
                                }
                                className={
                                    selectedDiscussion?.id ===
                                    discussion.id
                                        ? "discussion-item selected"
                                        : "discussion-item"
                                }
                                onClick={() =>
                                    selectDiscussion(
                                        discussion
                                    )
                                }
                            >
                                <div className="discussion-item-title">
                                    {
                                        discussion.title
                                    }
                                </div>

                                <div className="discussion-item-info">
                                    <span>
                                        {
                                            discussion.specialty
                                        }
                                    </span>

                                    <span>
                                        {
                                            discussion.participantCount
                                        }{" "}
                                        HCPs
                                    </span>
                                </div>
                            </button>
                        )
                    )}
                </div>
            </aside>


            <main className="discussion-main">
                {!selectedDiscussion ? (
                    <div className="select-discussion">
                        <h2>
                            Select a discussion
                        </h2>

                        <p>
                            Choose a topic to see
                            what other HCPs are
                            discussing.
                        </p>
                    </div>
                ) : (
                    <>
                        <header className="discussion-header">
                            <div>
                                <div className="discussion-specialty">
                                    {
                                        selectedDiscussion.specialty
                                    }
                                </div>

                                <h2>
                                    {
                                        selectedDiscussion.title
                                    }
                                </h2>

                                <p>
                                    {
                                        selectedDiscussion.description
                                    }
                                </p>
                            </div>

                            <div className="participants">
                                <strong>
                                    {
                                        selectedDiscussion.participantCount
                                    }
                                </strong>

                                <span>
                                    verified HCPs
                                </span>
                            </div>
                        </header>


                        {sendError && (
                            <div className="discussion-error">
                                {sendError}
                            </div>
                        )}


                        <div className="messages-area">
                            {messages.length ===
                            0 ? (
                                <div className="no-results">
                                    No messages yet.
                                </div>
                            ) : (
                                messages.map(
                                    (message) => (
                                        <Message
                                            key={
                                                message.id
                                            }
                                            message={
                                                message
                                            }
                                            currentUserId={
                                                user.uid
                                            }
                                            isPharma={
                                                userRole ===
                                                "pharma"
                                            }
                                            onPharmaReply={
                                                sendPharmaReply
                                            }
                                        />
                                    )
                                )
                            )}
                        </div>


                        <div className="message-composer">
                            <div className="anonymous-note">
                                <span>
                                    ◉
                                </span>

                                Posting anonymously
                            </div>

                            <div className="composer-row">
                                <input
                                    type="text"
                                    placeholder="Share your perspective..."
                                    value={
                                        newMessage
                                    }
                                    disabled={
                                        sending
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNewMessage(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            sendMessage();
                                        }
                                    }}
                                />

                                <button
                                    onClick={
                                        sendMessage
                                    }
                                    disabled={
                                        sending ||
                                        !newMessage.trim()
                                    }
                                >
                                    {sending
                                        ? "..."
                                        : "→"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}


/*
 * Safely get message timestamp.
 */
function getMessageTime(
    message: DiscussionMessage
): number | null {
    const createdAt =
        (
            message as DiscussionMessage & {
                createdAt?: Timestamp;
            }
        ).createdAt;

    if (!createdAt) {
        return null;
    }

    if (
        typeof createdAt.toMillis ===
        "function"
    ) {
        return createdAt.toMillis();
    }

    return null;
}


/*
 * Individual message.
 */
interface MessageProps {
    message: DiscussionMessage;
    currentUserId: string;
    isPharma: boolean;

    onPharmaReply: (
        parentMessageId: string,
        text: string
    ) => Promise<void>;
}


function Message({
    message,
    currentUserId,
    isPharma,
    onPharmaReply,
}: MessageProps) {
    const [replyOpen, setReplyOpen] =
        useState(false);

    const [replyText, setReplyText] =
        useState("");

    const [replySending, setReplySending] =
        useState(false);

    const isOwnMessage =
        message.authorId ===
        currentUserId;

    let displayName =
        message.anonymousName;

    if (
        message.role === "hcp" &&
        isOwnMessage
    ) {
        displayName = "You";
    }

    let messageClass =
        "message";

    if (isOwnMessage) {
        messageClass =
            "message own-message";
    } else if (
        message.role === "pharma"
    ) {
        messageClass =
            "message pharma-reply";
    }

    const createdAt =
        (
            message as DiscussionMessage & {
                createdAt?: Timestamp;
            }
        ).createdAt;

    let messageTime = "";

    if (
        createdAt &&
        typeof createdAt.toDate ===
            "function"
    ) {
        messageTime =
            createdAt
                .toDate()
                .toLocaleString();
    }

    const submitReply = async () => {
        if (
            !replyText.trim() ||
            replySending
        ) {
            return;
        }

        setReplySending(true);

        try {
            await onPharmaReply(
                message.id,
                replyText
            );

            setReplyText("");
            setReplyOpen(false);
        } catch (error) {
            console.error(
                "Error submitting pharma reply:",
                error
            );
        } finally {
            setReplySending(false);
        }
    };

    return (
        <div className={messageClass}>
            <div className="message-header">
                <div className="avatar">
                    {message.role ===
                    "pharma"
                        ? "P"
                        : isOwnMessage
                            ? "Y"
                            : "A"}
                </div>

                <div>
                    <div className="message-name">
                        {displayName}

                        {message.role ===
                            "pharma" && (
                            <span className="verified-badge">
                                ✓ Verified Pharma
                            </span>
                        )}
                    </div>

                    {messageTime && (
                        <div className="message-time">
                            {messageTime}
                        </div>
                    )}
                </div>
            </div>

            <div className="message-text">
                {message.text}
            </div>

            {isPharma &&
                message.role === "hcp" && (
                    <button
                        className="reply-button"
                        onClick={() =>
                            setReplyOpen(
                                !replyOpen
                            )
                        }
                    >
                        {replyOpen
                            ? "Cancel"
                            : "Reply as Pharma"}
                    </button>
                )}

            {isPharma &&
                replyOpen && (
                    <div className="pharma-reply-composer">
                        <div className="pharma-label">
                            Verified Pharma
                            Response
                        </div>

                        <textarea
                            placeholder="Write an approved response..."
                            value={
                                replyText
                            }
                            disabled={
                                replySending
                            }
                            onChange={(
                                event
                            ) =>
                                setReplyText(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                        <button
                            onClick={
                                submitReply
                            }
                            disabled={
                                replySending ||
                                !replyText.trim()
                            }
                        >
                            {replySending
                                ? "Posting..."
                                : "Post Response"}
                        </button>
                    </div>
                )}
        </div>
    );
}


export default DiscussionPage;
