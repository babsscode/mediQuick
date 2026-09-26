import { useEffect, useMemo, useState } from "react";

import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    Timestamp
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import type {
    Discussion,
    DiscussionMessage
} from "../types";

import "../DiscussionPage.css";


function DiscussionPage() {

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


    /*
     * Load available discussions
     */
    useEffect(() => {

        const discussionsRef =
            collection(db, "discussions");

        const discussionsQuery =
            query(
                discussionsRef,
                orderBy("participantCount", "desc")
            );

        const unsubscribe =
            onSnapshot(
                discussionsQuery,
                (snapshot) => {

                    const loadedDiscussions =
                        snapshot.docs.map((document) => ({
                            id: document.id,
                            ...document.data()
                        })) as Discussion[];

                    setDiscussions(loadedDiscussions);
                    setLoading(false);

                    /*
                     * Automatically open the first
                     * discussion when the page loads.
                     */
                    if (
                        loadedDiscussions.length > 0 &&
                        selectedDiscussion === null
                    ) {
                        setSelectedDiscussion(
                            loadedDiscussions[0]
                        );
                    }
                }
            );

        return () => unsubscribe();

    }, [selectedDiscussion]);


    /*
     * Load messages whenever the selected
     * discussion changes.
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
                        snapshot.docs.map((document) => ({
                            id: document.id,
                            ...document.data()
                        })) as DiscussionMessage[];

                    setMessages(loadedMessages);
                }
            );

        return () => unsubscribe();

    }, [selectedDiscussion]);


    /*
     * Search discussions.
     *
     * For the MVP, we're loading the discussions
     * and filtering them in React.
     */
    const filteredDiscussions =
        useMemo(() => {

            const searchText =
                search.toLowerCase().trim();

            if (searchText === "") {

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

        }, [discussions, search]);


    /*
     * Send a new HCP message.
     */
    const sendMessage = async () => {

        if (
            !selectedDiscussion ||
            newMessage.trim() === ""
        ) {
            return;
        }

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
                text: newMessage.trim(),

                role: "hcp",

                /*
                 * Keep the HCP anonymous.
                 */
                anonymousName: "Anonymous HCP",

                verified: true,

                createdAt: Timestamp.now(),

                parentMessageId: null
            }
        );

        setNewMessage("");
    };


    /*
     * Create a pharma response to a specific
     * HCP message.
     */
    const sendPharmaReply = async (
        parentMessageId: string,
        text: string
    ) => {

        if (!selectedDiscussion || text.trim() === "") {
            return;
        }

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
                text: text.trim(),

                role: "pharma",

                anonymousName:
                    "Verified Pharma Representative",

                company: "Example Pharma",

                verified: true,

                createdAt: Timestamp.now(),

                parentMessageId
            }
        );
    };


    if (loading) {

        return (
            <div className="discussion-loading">
                Loading discussions...
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
                            setSearch(event.target.value)
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
                                            {discussion.participantCount}
                                            {" "}HCPs
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
                                    {selectedDiscussion.specialty}
                                </div>

                                <h2>
                                    {selectedDiscussion.title}
                                </h2>

                                <p>
                                    {selectedDiscussion.description}
                                </p>

                            </div>

                            <div className="participants">

                                <strong>
                                    {selectedDiscussion.participantCount}
                                </strong>

                                <span>
                                    verified HCPs
                                </span>

                            </div>

                        </header>


                        {/* MESSAGES */}

                        <div className="messages-area">

                            {messages.map(
                                (message) => (

                                    <Message
                                        key={message.id}
                                        message={message}
                                        onPharmaReply={
                                            sendPharmaReply
                                        }
                                    />

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


interface MessageProps {
    message: DiscussionMessage;

    onPharmaReply: (
        parentMessageId: string,
        text: string
    ) => void;
}


function Message({
    message,
    onPharmaReply
}: MessageProps) {

    const [replyOpen, setReplyOpen] =
        useState(false);

    const [replyText, setReplyText] =
        useState("");


    const submitReply = () => {

        onPharmaReply(
            message.id,
            replyText
        );

        setReplyText("");
        setReplyOpen(false);
    };


    return (

        <div
            className={
                message.parentMessageId
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
                        Just now
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
                        setReplyOpen(!replyOpen)
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