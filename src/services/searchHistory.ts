import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

export async function saveSearch(
  userId: string,
  searchQuery: string
) {
  const searchesRef = collection(
    db,
    "users",
    userId,
    "searchHistory"
  );

  await addDoc(searchesRef, {
    query: searchQuery,
    searchedAt: serverTimestamp(),
  });
}

export async function getSearchHistory(userId: string) {
  const searchesRef = collection(
    db,
    "users",
    userId,
    "searchHistory"
  );

  const q = query(
    searchesRef,
    orderBy("searchedAt", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
