import { Timestamp } from "firebase/firestore";

export type SmsMessage = {
    id: string;
    userId: string;
    text: string;
    createdAt: Timestamp;
};

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