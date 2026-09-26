import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type TopicData = {
    topic: string;
    engagement: number;
};

type EngagementData = {
    month: string;
    engagement: number;
};

type TrendChartProps = {
    topicData: TopicData[];
    engagementData: EngagementData[];
};

function TrendChart({
    topicData,
    engagementData,
}: TrendChartProps) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="mb-1 text-base font-semibold text-gray-900">
                    Topics You're Engaging With
                </h3>

                <p className="mb-5 text-xs text-gray-400">
                    Based on your recent activity
                </p>

                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={topicData}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                type="number"
                                domain={[0, 100]}
                            />

                            <YAxis
                                dataKey="topic"
                                type="category"
                                width={90}
                                tick={{ fontSize: 11 }}
                            />

                            <Tooltip />

                            <Bar
                                dataKey="engagement"
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="mb-1 text-base font-semibold text-gray-900">
                    Your Engagement Over Time
                </h3>

                <p className="mb-5 text-xs text-gray-400">
                    Information activity over recent months
                </p>

                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={engagementData}
                            margin={{
                                top: 5,
                                right: 10,
                                left: 0,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="month" />

                            <YAxis domain={[0, 100]} />

                            <Tooltip />

                            <Line
                                type="monotone"
                                dataKey="engagement"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default TrendChart;