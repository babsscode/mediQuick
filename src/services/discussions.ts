import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

// Create a discussion
export async function createDiscussion(
  userId: string,
  title: string,
  body: string
) {
  const discussionsRef = collection(db, "discussions");

  const docRef = await addDoc(discussionsRef, {
    title,
    body,
    authorId: userId,
    source: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    replyCount: 0,
  });

  return docRef.id;
}

// Create a reply
export async function createReply(
  userId: string,
  discussionId: string,
  body: string
) {
  const repliesRef = collection(
    db,
    "discussions",
    discussionId,
    "replies"
  );

  const docRef = await addDoc(repliesRef, {
    authorId: userId,
    body,
    source: "user",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// Get replies for a discussion
export async function getReplies(discussionId: string) {
  const repliesRef = collection(
    db,
    "discussions",
    discussionId,
    "replies"
  );

  const q = query(
    repliesRef,
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}