type Resource = {
    id: string;
    title: string;
    description: string;
    topic: string;
    category: string;
    date: string;
};

type ResourceCardProps = {
    resource: Resource;
};

function ResourceCard({
    resource,
}: ResourceCardProps) {
    return (
        <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-mist hover:shadow-md">

            {/* TOP */}

            <div className="mb-4 flex items-start justify-between gap-3">

                <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink">
                    Resource
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-xl">
                    📄
                </div>

            </div>


            {/* CATEGORY */}

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {resource.category}
            </p>


            {/* TITLE */}

            <h2 className="mb-2 text-lg font-semibold leading-snug text-heading">
                {resource.title}
            </h2>


            {/* DESCRIPTION */}

            <p className="mb-5 flex-1 text-sm leading-6 text-ink">
                {resource.description}
            </p>


            {/* BOTTOM */}

            <div className="border-t border-line pt-4">

                <p className="text-xs font-medium text-ink">
                    {resource.topic}
                </p>

                <p className="mt-1 text-xs text-muted">
                    {resource.date}
                </p>

            </div>

        </article>
    );
}

export default ResourceCard;
