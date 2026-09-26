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

export type HcpActivity = {
    specialty: string;
    field: string;
    searches: string[];
    viewedContentIds: string[];
    savedContentIds: string[];
    interactedTopics: string[];
};

export type InformationItem = {
    id: string;
    title: string;
    type:
        | "Article"
        | "Sponsor Resource"
        | "Clinical Update"
        | "Resource";
    source: string;
    specialty: string;
    summary: string;
    content: string;
    date: string;
    tags: string[];
};