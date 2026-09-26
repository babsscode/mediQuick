import { Timestamp } from "firebase/firestore";

export interface SmsMessage {
    id: string;
    title: string;
    body: string;
    drug: string;
    sender: string;
    date: Timestamp;
    link?: string;
}