import { useMemo, useState } from "react";

import InfoCard from "../components/InfoCard";
import TrendChart from "../components/TrendChart";

import {
    sampleHcpActivity,
    sampleInformation,
} from "../data/sampleInformation";

import type { InformationItem } from "../types";

function Information() {
    const [selectedItem, setSelectedItem] =
        useState<InformationItem | null>(null);

    /*
     * FIREBASE TODO:
     *
     * Replace sampleHcpActivity with the authenticated
     * user's activity retrieved from Firebase.
     *
     * Replace sampleInformation with information content
     * retrieved from Firebase.
     */

    const hcpActivity = sampleHcpActivity;
    const information = sampleInformation;

    /*
     * Personalization logic.
     *
     * This is intentionally simple for the demo.
     * Later, Firebase activity can feed the same logic.
     */
    const personalizedInformation = useMemo(() => {
        return information
            .map((item) => {
                let score = 0;

                if (
                    item.specialty.toLowerCase() ===
                    hcpActivity.specialty.toLowerCase()
                ) {
                    score += 5;
                }

                item.tags.forEach((tag) => {
                    const tagLower = tag.toLowerCase();

                    hcpActivity.searches.forEach((search) => {
                        if (
                            tagLower.includes(search.toLowerCase()) ||
                            search.toLowerCase().includes(tagLower)
                        ) {
                            score += 3;
                        }
                    });

                    hcpActivity.interactedTopics.forEach((topic) => {
                        if (
                            tagLower.includes(topic.toLowerCase()) ||
                            topic.toLowerCase().includes(tagLower)
                        ) {
                            score += 3;
                        }
                    });
                });

                if (
                    hcpActivity.viewedContentIds.includes(item.id)
                ) {
                    score += 4;
                }

                if (
                    hcpActivity.savedContentIds.includes(item.id)
                ) {
                    score += 5;
                }

                return {
                    item,
                    score,
                };
            })
            .sort((a, b) => b.score - a.score)
            .map((entry) => entry.item);
    }, [information, hcpActivity]);

    /*
     * MOCK DATA FOR THE DEMO.
     *
     * Later these values can be calculated from Firebase activity.
     */
    const topicData = [
        {
            topic: "Hypertension",
            engagement: 82,
        },
        {
            topic: "Heart Failure",
            engagement: 68,
        },
        {
            topic: "ACE Inhibitors",
            engagement: 61,
        },
        {
            topic: "Clinical Trials",
            engagement: 42,
        },
    ];

    const engagementData = [
        {
            month: "Jun",
            engagement: 32,
        },
        {
            month: "Jul",
            engagement: 45,
        },
        {
            month: "Aug",
            engagement: 59,
        },
        {
            month: "Sep",
            engagement: 74,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Information
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Relevant clinical updates, resources, and insights
                        personalized to your interests.
                    </p>
                </div>

                {/* Main layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">

                    {/* Information grid */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Recommended for You
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Based on your specialty and recent
                                    engagement
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {personalizedInformation.map((item) => (
                                <InfoCard
                                    key={item.id}
                                    item={item}
                                    onClick={() =>
                                        setSelectedItem(item)
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    {/* Specialty Pulse */}
                    <aside>
                        <div className="sticky top-6">

                            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Your Specialty Pulse
                                        </p>

                                        <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                                            {hcpActivity.specialty}
                                        </h2>
                                    </div>

                                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                        Personalized
                                    </div>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-gray-500">
                                    Your pulse is based on recent searches,
                                    content views, saved resources, and
                                    topics you've interacted with.
                                </p>
                            </div>

                            <TrendChart
                                topicData={topicData}
                                engagementData={engagementData}
                            />

                        </div>
                    </aside>
                </div>
            </div>

            {/* Detail modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* Modal header */}
                        <div className="mb-6 flex items-start justify-between gap-6">
                            <div>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                    {selectedItem.type}
                                </span>

                                <h2 className="mt-4 text-3xl font-semibold text-gray-900">
                                    {selectedItem.title}
                                </h2>

                                <p className="mt-2 text-sm text-gray-400">
                                    {selectedItem.source} ·{" "}
                                    {selectedItem.date}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedItem(null)
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal content */}
                        <div className="space-y-6">
                            <p className="text-lg leading-8 text-gray-600">
                                {selectedItem.summary}
                            </p>

                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                    About this resource
                                </h3>

                                <p className="leading-7 text-gray-600">
                                    {selectedItem.content}
                                </p>
                            </div>

                            <div>
                                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                                    Topics
                                </h3>

                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Information;