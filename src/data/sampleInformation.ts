import type { HcpActivity, InformationItem } from "../types";

export const sampleHcpActivity: HcpActivity = {
    specialty: "Cardiology",
    field: "Cardiology",
    searches: [
        "hypertension",
        "heart failure",
        "ACE inhibitors",
    ],
    viewedContentIds: [
        "1",
        "3",
    ],
    savedContentIds: [
        "1",
    ],
    interactedTopics: [
        "Hypertension",
        "Heart Failure",
        "ACE Inhibitors",
    ],
};

export const sampleInformation: InformationItem[] = [
    {
        id: "1",
        title: "New Developments in Hypertension Management",
        type: "Clinical Update",
        source: "Cardiology Clinical Review",
        specialty: "Cardiology",
        summary:
            "A summary of recent developments and considerations in hypertension management.",
        content:
            "This clinical update reviews recent developments in hypertension management, including treatment considerations, patient monitoring, and areas of ongoing clinical research.",
        date: "September 24, 2026",
        tags: [
            "Hypertension",
            "ACE Inhibitors",
            "Blood Pressure",
        ],
    },
    {
        id: "2",
        title: "Understanding Heart Failure Treatment Pathways",
        type: "Article",
        source: "HCP Clinical Insights",
        specialty: "Cardiology",
        summary:
            "An overview of treatment pathways and clinical considerations for patients with heart failure.",
        content:
            "This resource provides an overview of heart failure treatment pathways and highlights areas where clinicians may want to consider additional patient monitoring and follow-up.",
        date: "September 22, 2026",
        tags: [
            "Heart Failure",
            "Cardiology",
            "Treatment",
        ],
    },
    {
        id: "3",
        title: "ACE Inhibitors: Clinical Resource Guide",
        type: "Sponsor Resource",
        source: "Pharma Clinical Resources",
        specialty: "Cardiology",
        summary:
            "A quick-reference resource covering ACE inhibitor considerations for healthcare professionals.",
        content:
            "This sponsor resource provides educational information about ACE inhibitors, including mechanism of action, common considerations, and areas of clinical interest.",
        date: "September 20, 2026",
        tags: [
            "ACE Inhibitors",
            "Hypertension",
            "Medication",
        ],
    },
    {
        id: "4",
        title: "Emerging Research in Cardiovascular Disease",
        type: "Clinical Update",
        source: "Clinical Research Network",
        specialty: "Cardiology",
        summary:
            "A look at emerging areas of cardiovascular research and clinical trials.",
        content:
            "This update highlights emerging areas of cardiovascular research, including new therapeutic approaches and ongoing clinical trials.",
        date: "September 18, 2026",
        tags: [
            "Clinical Trials",
            "Cardiology",
            "Research",
        ],
    },
    {
        id: "5",
        title: "Patient Monitoring in Chronic Cardiovascular Care",
        type: "Resource",
        source: "HCP Resources",
        specialty: "Cardiology",
        summary:
            "Practical considerations for monitoring patients receiving long-term cardiovascular care.",
        content:
            "This resource provides information about patient monitoring, follow-up considerations, and long-term cardiovascular care.",
        date: "September 15, 2026",
        tags: [
            "Patient Monitoring",
            "Cardiology",
            "Heart Failure",
        ],
    },
    {
        id: "6",
        title: "New Perspectives on Cardiovascular Risk",
        type: "Article",
        source: "Medical Insights",
        specialty: "Cardiology",
        summary:
            "An overview of current areas of interest surrounding cardiovascular risk.",
        content:
            "This article explores several areas of current interest related to cardiovascular risk and discusses topics being investigated by the medical community.",
        date: "September 12, 2026",
        tags: [
            "Cardiovascular Risk",
            "Hypertension",
            "Research",
        ],
    },
];