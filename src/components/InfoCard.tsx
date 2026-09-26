import type { InformationItem } from "../types";

type InfoCardProps = {
    item: InformationItem;
    onClick: () => void;
};

function InfoCard({ item, onClick }: InfoCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {item.type}
                </span>

                <span className="text-xs text-gray-400">
                    {item.date}
                </span>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {item.title}
            </h3>

            <p className="mb-4 text-sm leading-6 text-gray-500">
                {item.summary}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-500"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <p className="text-sm font-medium text-gray-700">
                {item.source}
            </p>
        </button>
    );
}

export default InfoCard;