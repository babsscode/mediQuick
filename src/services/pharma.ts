import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

export async function getDrug(drugId: string) {
  const drugRef = doc(db, "pharmaData", drugId);

  const snapshot = await getDoc(drugRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
