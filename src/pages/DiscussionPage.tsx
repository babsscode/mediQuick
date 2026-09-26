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

    const [newMessage, setNewMessage] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);

    const [sendError, setSendError] =
        useState("");


    /*
     * Get the currently signed-in user
     * and their role from Firestore.
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

                        if (userSnapshot.exists()) {

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

                    setSelectedDiscussion(
                        (current) => {

                            /*
                             * Automatically open the first
                             * discussion when the page loads.
                             */
                            if (current === null) {

                                const firstDiscussion =
                                    loadedDiscussions[0] ??
                                    null;

                                if (firstDiscussion) {

                                    setOpenedDiscussions(
                                        (currentOpened) => {

                                            const alreadyOpen =
                                                currentOpened.some(
                                                    (discussion) =>
                                                        discussion.id ===
                                                        firstDiscussion.id
                                                );

                                            if (alreadyOpen) {
                                                return currentOpened;
                                            }

                                            return [
                                                firstDiscussion,
                                                ...currentOpened,
                                            ];
                                        }
                                    );
                                }

                                return firstDiscussion;
                            }

                            /*
                             * Keep the currently selected
                             * discussion updated if Firestore
                             * changes its participant count.
                             */
                            const updatedDiscussion =
                                loadedDiscussions.find(
                                    (discussion) =>
                                        discussion.id ===
                                        current.id
                                );

                            if (updatedDiscussion) {

                                setOpenedDiscussions(
                                    (currentOpened) =>
                                        currentOpened.map(
                                            (discussion) =>
                                                discussion.id ===
                                                updatedDiscussion.id
                                                    ? updatedDiscussion
                                                    : discussion
                                        )
                                );

                                return updatedDiscussion;
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
                }
            );

        return () => unsubscribe();

    }, []);


    /*
     * Load messages for the selected discussion.
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

                    setSendError(
                        `Unable to load messages: ${error.message}`
                    );
                }
            );

        return () => unsubscribe();

    }, [selectedDiscussion]);


    /*
     * Filter discussions using the search box.
     */
    const filteredDiscussions =
        useMemo(() => {

            const searchText =
                search
                    .toLowerCase()
                    .trim();

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

        }, [
            discussions,
            search,
        ]);


    /*
     * Keep opened discussions in the sidebar
     * even after switching to another discussion.
     */
    const sidebarDiscussions =
        useMemo(() => {

            const combined: Discussion[] = [];

            openedDiscussions.forEach(
                (discussion) => {

                    const latestDiscussion =
                        discussions.find(
                            (item) =>
                                item.id ===
                                discussion.id
                        );

                    if (!latestDiscussion) {
                        return;
                    }

                    if (search.trim() !== "") {

                        const searchText =
                            search
                                .toLowerCase()
                                .trim();

                        const matchesSearch =
                            latestDiscussion.title
                                .toLowerCase()
                                .includes(searchText) ||

                            latestDiscussion.description
                                .toLowerCase()
                                .includes(searchText) ||

                            latestDiscussion.specialty
                                .toLowerCase()
                                .includes(searchText);

                        if (!matchesSearch) {
                            return;
                        }
                    }

                    combined.push(
                        latestDiscussion
                    );
                }
            );

            filteredDiscussions.forEach(
                (discussion) => {

                    const alreadyIncluded =
                        combined.some(
                            (item) =>
                                item.id ===
                                discussion.id
                        );

                    if (!alreadyIncluded) {

                        combined.push(
                            discussion
                        );
                    }
                }
            );

            return combined;

        }, [
            discussions,
            filteredDiscussions,
            openedDiscussions,
            search,
        ]);


    /*
     * Select a discussion and add it to the
     * list of opened discussions.
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
     * Send a new HCP message.
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
        setSendError("");

        try {

            const text =
                newMessage.trim();

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

                    text,

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

            if (error instanceof Error) {

                setSendError(
                    `Message could not be sent: ${error.message}`
                );

            } else {

                setSendError(
                    "Message could not be sent. Please try again."
                );
            }

        } finally {

            setSending(false);
        }
    };


    /*
     * Send a response as a verified Pharma representative.
     */
    const sendPharmaReply = async (
        parentMessageId: string,
        text: string
    ) => {

        if (
            !user ||
            userRole !== "pharma" ||
            !selectedDiscussion ||
            text.trim() === ""
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

            if (error instanceof Error) {

                setSendError(
                    `Response could not be sent: ${error.message}`
                );

            } else {

                setSendError(
                    "Response could not be sent. Please try again."
                );
            }

            throw error;
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
     * User must be signed in.
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

            <aside className="discussion-sidebar">

                <div className="discussion-sidebar-header">

                    <h1>
                        Discussions
                    </h1>

                    <p>
                        Learn from verified HCP perspectives
                    </p>

                </div>


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


                <div className="discussion-list">

                    {search === "" && (
                        <div className="section-label">
                            DISCUSSIONS
                        </div>
                    )}

                    {search !== "" && (
                        <div className="section-label">
                            SEARCH RESULTS
                        </div>
                    )}


                    {sidebarDiscussions.length === 0 ? (

                        <div className="no-results">
                            No discussions found.
                        </div>

                    ) : (

                        sidebarDiscussions.map(
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
                                        selectDiscussion(
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


                        {sendError !== "" && (

                            <div className="discussion-error">

                                {sendError}

                            </div>

                        )}


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
                                            currentUserId={user.uid}
                                            isPharma={
                                                userRole === "pharma"
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
                                    disabled={
                                        sending ||
                                        newMessage.trim() === ""
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
 * Individual discussion message.
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


    /*
     * Only a message with this user's authorId
     * is considered their own message.
     *
     * This means pre-generated messages stay on
     * the left even if they have a parentMessageId.
     */
    const isOwnMessage =
        message.authorId === currentUserId;


    /*
     * Determine how the message should look.
     */
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


    /*
     * Submit a Pharma response.
     */
    const submitReply = async () => {

        if (
            replyText.trim() === "" ||
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

        <div
            className={messageClass}
        >

            <div className="message-header">

                <div className="avatar">

                    {message.role === "pharma"
                        ? "P"
                        : isOwnMessage
                            ? "Y"
                            : "A"}

                </div>

                <div>

                    <div className="message-name">

                        {displayName}

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
                            Verified Pharma Response
                        </div>

                        <textarea
                            placeholder="Write an approved response..."
                            value={replyText}
                            disabled={replySending}
                            onChange={(event) =>
                                setReplyText(
                                    event.target.value
                                )
                            }
                        />

                        <button
                            onClick={submitReply}
                            disabled={
                                replySending ||
                                replyText.trim() === ""
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