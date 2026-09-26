import { useEffect, useMemo, useState } from "react";

import {
    collection,
    addDoc,
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


function DiscussionPage() {

    const [user, setUser] =
        useState<User | null>(null);

    const [discussions, setDiscussions] =
        useState<Discussion[]>([]);

    const [selectedDiscussion, setSelectedDiscussion] =
        useState<Discussion | null>(null);

    const [messages, setMessages] =
        useState<DiscussionMessage[]>([]);

    const [search, setSearch] =
        useState("");

    const [newMessage, setNewMessage] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);


    /*
     * Get currently authenticated user.
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
     * Load discussions.
     *
     * Firestore:
     *
     * discussions/{discussionId}
     */
    useEffect(() => {

        const discussionsRef =
            collection(db, "discussions");

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

                    const loadedDiscussions =
                        snapshot.docs.map(
                            (document) => ({
                                id: document.id,
                                ...document.data(),
                            })
                        ) as Discussion[];

                    setDiscussions(
                        loadedDiscussions
                    );

                    setLoading(false);

                    /*
                     * Automatically select the
                     * first discussion.
                     */
                    setSelectedDiscussion(
                        (current) => {

                            if (current === null) {
                                return (
                                    loadedDiscussions[0] ??
                                    null
                                );
                            }

                            /*
                             * Update the selected
                             * discussion with fresh
                             * Firestore data.
                             */
                            return (
                                loadedDiscussions.find(
                                    (discussion) =>
                                        discussion.id ===
                                        current.id
                                ) ?? null
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
                }
            );

        return () => unsubscribe();

    }, []);


    /*
     * Load messages for selected discussion.
     *
     * Firestore:
     *
     * discussions/{discussionId}/messages/{messageId}
     */
    useEffect(() => {

        if (!selectedDiscussion) {
            setMessages([]);
            return;
        }

        const messagesRef =
            collection(
                db,
                "discussions",
                selectedDiscussion.id,
                "messages"
            );

        const messagesQuery =
            query(
                messagesRef,
                orderBy("createdAt", "asc")
            );

        const unsubscribe =
            onSnapshot(
                messagesQuery,
                (snapshot) => {

                    const loadedMessages =
                        snapshot.docs.map(
                            (document) => ({
                                id: document.id,
                                ...document.data(),
                            })
                        ) as DiscussionMessage[];

                    setMessages(
                        loadedMessages
                    );
                },
                (error) => {

                    console.error(
                        "Error loading discussion messages:",
                        error
                    );
                }
            );

        return () => unsubscribe();

    }, [selectedDiscussion]);


    /*
     * Search discussions.
     */
    const filteredDiscussions =
        useMemo(() => {

            const searchText =
                search
                    .toLowerCase()
                    .trim();

            /*
             * No search:
             * show popular discussions.
             */
            if (searchText === "") {

                return discussions.filter(
                    (discussion) =>
                        discussion.popular
                );
            }

            /*
             * Search title,
             * description and specialty.
             */
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
     * Send a new HCP discussion message.
     */
    const sendMessage = async () => {

        if (
            !user ||
            !selectedDiscussion ||
            newMessage.trim() === "" ||
            sending
        ) {
            return;
        }

        setSending(true);

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
                    /*
                     * Firebase authenticated user.
                     */
                    userId: user.uid,

                    /*
                     * Actual message content.
                     */
                    text: newMessage.trim(),

                    /*
                     * HCP post.
                     */
                    role: "hcp",

                    /*
                     * Keep the HCP anonymous
                     * in the UI.
                     */
                    anonymousName:
                        "Anonymous HCP",

                    verified: true,

                    /*
                     * Top-level message.
                     */
                    parentMessageId: null,

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

        } finally {

            setSending(false);
        }
    };


    /*
     * Create a pharma reply to an HCP message.
     *
     * The reply is stored in the SAME
     * messages collection.
     *
     * parentMessageId identifies the
     * message being replied to.
     */
    const sendPharmaReply = async (
        parentMessageId: string,
        text: string
    ) => {

        if (
            !user ||
            !selectedDiscussion ||
            text.trim() === ""
        ) {
            return;
        }

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
                    /*
                     * Firebase user who created
                     * the response.
                     */
                    userId: user.uid,

                    text: text.trim(),

                    role: "pharma",

                    anonymousName:
                        "Verified Pharma Representative",

                    company:
                        "Example Pharma",

                    verified: true,

                    /*
                     * This makes it a reply.
                     */
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
        }
    };


    /*
     * Loading state.
     */
    if (loading) {

        return (
            <div className="discussion-loading">
                Loading discussions...
            </div>
        );
    }


    /*
     * Authentication check.
     */
    if (!user) {

        return (
            <div className="discussion-loading">
                Please sign in to view discussions.
            </div>
        );
    }


    return (

        <div className="discussion-page">

            {/* LEFT SIDE */}

            <aside className="discussion-sidebar">

                <div className="discussion-sidebar-header">

                    <h1>
                        Discussions
                    </h1>

                    <p>
                        Learn from verified HCP perspectives
                    </p>

                </div>


                {/* SEARCH */}

                <div className="discussion-search">

                    <span>
                        ⌕
                    </span>

                    <input
                        type="text"
                        placeholder="Search discussions..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                {/* DISCUSSION LIST */}

                <div className="discussion-list">

                    {search === "" && (
                        <div className="section-label">
                            POPULAR DISCUSSIONS
                        </div>
                    )}

                    {search !== "" && (
                        <div className="section-label">
                            SEARCH RESULTS
                        </div>
                    )}


                    {filteredDiscussions.length === 0 ? (

                        <div className="no-results">
                            No discussions found.
                        </div>

                    ) : (

                        filteredDiscussions.map(
                            (discussion) => (

                                <button
                                    key={discussion.id}
                                    className={
                                        selectedDiscussion?.id ===
                                        discussion.id
                                            ? "discussion-item selected"
                                            : "discussion-item"
                                    }
                                    onClick={() =>
                                        setSelectedDiscussion(
                                            discussion
                                        )
                                    }
                                >

                                    <div className="discussion-item-title">
                                        {discussion.title}
                                    </div>

                                    <div className="discussion-item-info">

                                        <span>
                                            {discussion.specialty}
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
                        )
                    )}

                </div>

            </aside>


            {/* RIGHT SIDE */}

            <main className="discussion-main">

                {!selectedDiscussion ? (

                    <div className="select-discussion">

                        <h2>
                            Select a discussion
                        </h2>

                        <p>
                            Choose a topic to see what
                            other HCPs are discussing.
                        </p>

                    </div>

                ) : (

                    <>

                        {/* DISCUSSION HEADER */}

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
                                        selectedDiscussion
                                            .participantCount
                                    }
                                </strong>

                                <span>
                                    verified HCPs
                                </span>

                            </div>

                        </header>


                        {/* MESSAGES */}

                        <div className="messages-area">

                            {messages.length === 0 ? (

                                <div className="no-results">
                                    No messages yet.
                                </div>

                            ) : (

                                messages.map(
                                    (message) => (

                                        <Message
                                            key={message.id}
                                            message={message}
                                            onPharmaReply={
                                                sendPharmaReply
                                            }
                                        />

                                    )
                                )

                            )}

                        </div>


                        {/* HCP MESSAGE BOX */}

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
                                    value={newMessage}
                                    disabled={sending}
                                    onChange={(event) =>
                                        setNewMessage(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {

                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            sendMessage();
                                        }

                                    }}
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={sending}
                                >
                                    →
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
 * Individual discussion message.
 */
interface MessageProps {

    message: DiscussionMessage;

    onPharmaReply: (
        parentMessageId: string,
        text: string
    ) => void;
}


function Message({
    message,
    onPharmaReply,
}: MessageProps) {

    const [replyOpen, setReplyOpen] =
        useState(false);

    const [replyText, setReplyText] =
        useState("");


    /*
     * Submit pharma reply.
     */
    const submitReply = () => {

        if (replyText.trim() === "") {
            return;
        }

        onPharmaReply(
            message.id,
            replyText
        );

        setReplyText("");
        setReplyOpen(false);
    };


    /*
     * Reply styling.
     */
    const isReply =
        message.parentMessageId !== null;


    return (

        <div
            className={
                isReply
                    ? "message pharma-reply"
                    : "message"
            }
        >

            <div className="message-header">

                <div className="avatar">

                    {message.role === "pharma"
                        ? "P"
                        : "A"}

                </div>

                <div>

                    <div className="message-name">

                        {message.anonymousName}

                        {message.role === "pharma" && (
                            <span className="verified-badge">
                                ✓ Verified Pharma
                            </span>
                        )}

                    </div>

                    <div className="message-time">

                        {message.createdAt
                            ?.toDate()
                            .toLocaleString()}

                    </div>

                </div>

            </div>


            <div className="message-text">

                {message.text}

            </div>


            {/* PHARMA REPLY BUTTON */}

            {message.role === "hcp" && (

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


            {/* PHARMA REPLY COMPOSER */}

            {replyOpen && (

                <div className="pharma-reply-composer">

                    <div className="pharma-label">
                        Verified Pharma Response
                    </div>

                    <textarea
                        placeholder="Write an approved response..."
                        value={replyText}
                        onChange={(event) =>
                            setReplyText(
                                event.target.value
                            )
                        }
                    />

                    <button
                        onClick={submitReply}
                    >
                        Post Response
                    </button>

                </div>

            )}

        </div>
    );
}


export default DiscussionPage;
