import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

export async function getTrendingTopics() {
  const trendsRef = collection(db, "trends");

  const q = query(
    trendsRef,
    orderBy("trendScore", "desc"),
    limit(20)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
