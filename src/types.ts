import { Timestamp } from "firebase/firestore";
export type RegistrationRole = "hcp" | "pharma" | "team_member";

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
    authorId: string;
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

export type PeerDoctor = {
    id: string;
    uid: string;
    name: string;
    specialty: string;
    location: string;
    about: string;
    bio?: string;
    interests?: string[];
    relevanceReason?: string;
};

export type PeerRequest = {
    id: string;
    fromDoctorId: string;
    fromDoctorName: string;
    specialty: string;
    location: string;
    title: string;
    question: string;
    topics: string[];
    status: "pending" | "accepted" | "rejected";
};

export type PeerMessage = {
    id: string;
    sender: "me" | "them";
    text: string;
    timestamp: string;
};

export type PeerConversation = {
    id: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    location: string;
    title: string;
    originalQuestion: string;
    messages: PeerMessage[];
};