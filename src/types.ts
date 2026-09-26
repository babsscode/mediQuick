import { Timestamp } from "firebase/firestore";

export type SmsMessage = {
    id: string;
    userId: string;
    text: string;
    createdAt: Timestamp;
};
