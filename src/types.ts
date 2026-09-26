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
export interface Discussion {
    id: string;
    title: string;
    description: string;
    specialty: string;
    participantCount: number;
    popular: boolean;
    createdAt: Timestamp;
}

export interface DiscussionMessage {
    id: string;
    text: string;

    role: "hcp" | "pharma";

    anonymousName: string;

    company?: string;

    verified: boolean;

    createdAt: Timestamp;

    parentMessageId?: string | null;
}