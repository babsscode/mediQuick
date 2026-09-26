import type { PeerDoctor, PeerRequest, PeerConversation } from "../types";

export const sampleDoctors: PeerDoctor[] = [
    {
        id: "doctor-1",
        name: "Dr. Sarah Chen",
        specialty: "Cardiology",
        location: "Atlanta, GA",
        interests: [
            "Heart Failure",
            "Patient Access",
            "Hypertension",
        ],
        bio: "Cardiologist interested in heart failure treatment, patient access, and long-term cardiovascular care.",
    },
    {
        id: "doctor-2",
        name: "Dr. Michael Patel",
        specialty: "Cardiology",
        location: "Charlotte, NC",
        interests: [
            "Heart Failure",
            "Medication Access",
            "Treatment Sequencing",
        ],
        bio: "Cardiologist with clinical interests in heart failure management and medication access.",
    },
    {
        id: "doctor-3",
        name: "Dr. Emily Williams",
        specialty: "Cardiology",
        location: "Atlanta, GA",
        interests: [
            "Hypertension",
            "Heart Failure",
            "Clinical Research",
        ],
        bio: "Cardiologist focused on hypertension, cardiovascular disease, and clinical research.",
    },
    {
        id: "doctor-4",
        name: "Dr. James Lee",
        specialty: "Cardiology",
        location: "Nashville, TN",
        interests: [
            "Patient Access",
            "Heart Failure",
            "Health Equity",
        ],
        bio: "Cardiologist interested in patient access, treatment barriers, and cardiovascular health equity.",
    },
    {
        id: "doctor-5",
        name: "Dr. Maya Rodriguez",
        specialty: "Internal Medicine",
        location: "Atlanta, GA",
        interests: [
            "Hypertension",
            "Medication Access",
            "Chronic Disease",
        ],
        bio: "Internal medicine physician focused on hypertension and chronic disease management.",
    },
];

export const sampleRequests: PeerRequest[] = [
    {
        id: "request-1",
        fromDoctorId: "doctor-4",
        fromDoctorName: "Dr. James Lee",
        specialty: "Cardiology",
        location: "Nashville, TN",
        title: "Heart Failure Medication Access",
        question:
            "I'm interested in discussing how other cardiologists are handling medication access for heart failure patients.",
        topics: [
            "Heart Failure",
            "Patient Access",
            "Medication Access",
        ],
        status: "pending",
    },
    {
        id: "request-2",
        fromDoctorId: "doctor-3",
        fromDoctorName: "Dr. Emily Williams",
        specialty: "Cardiology",
        location: "Atlanta, GA",
        title: "Hypertension Treatment",
        question:
            "Has anyone seen interesting approaches to managing hypertension in patients who have not responded well to initial treatment?",
        topics: [
            "Hypertension",
            "Treatment",
        ],
        status: "pending",
    },
    {
        id: "request-3",
        fromDoctorId: "doctor-5",
        fromDoctorName: "Dr. Maya Rodriguez",
        specialty: "Internal Medicine",
        location: "Atlanta, GA",
        title: "Medication Access",
        question:
            "I'd like to hear how other physicians are helping patients navigate medication access challenges.",
        topics: [
            "Medication Access",
            "Patient Support",
        ],
        status: "pending",
    },
];

export const sampleConversations: PeerConversation[] = [
    {
        id: "conversation-1",
        doctorId: "doctor-1",
        doctorName: "Dr. Sarah Chen",
        specialty: "Cardiology",
        location: "Atlanta, GA",
        title: "Heart Failure Treatment",
        originalQuestion:
            "How are you approaching treatment sequencing for patients with heart failure?",
        messages: [
            {
                id: "message-1",
                sender: "me",
                text: "How are you approaching treatment sequencing for patients with heart failure?",
                timestamp: "10:32 AM",
            },
            {
                id: "message-2",
                sender: "them",
                text: "I've generally been focusing on the patient's clinical profile first and then adjusting based on response and tolerability.",
                timestamp: "10:36 AM",
            },
            {
                id: "message-3",
                sender: "me",
                text: "That's helpful. Have you noticed any particular challenges when patients also have difficulty accessing their medication?",
                timestamp: "10:40 AM",
            },
        ],
    },
];