import type { InformationItem } from "../types";

type InfoCardProps = {
    item: InformationItem;
    onClick: () => void;
};

function InfoCard({ item, onClick }: InfoCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-mist hover:shadow-md"
        >
            <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink">
                    {item.type}
                </span>

                <span className="text-xs text-muted">
                    {item.date}
                </span>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-heading">
                {item.title}
            </h3>

            <p className="mb-4 text-sm leading-6 text-ink">
                {item.summary}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full bg-mist px-2.5 py-1 text-xs text-ink"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <p className="text-sm font-medium text-ink">
                {item.source}
            </p>
        </button>
    );
}

export default InfoCard;
