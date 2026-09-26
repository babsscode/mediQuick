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
        <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">

            {/* TOP */}

            <div className="mb-4 flex items-start justify-between gap-3">

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Resource
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
                    📄
                </div>

            </div>


            {/* CATEGORY */}

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {resource.category}
            </p>


            {/* TITLE */}

            <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900">
                {resource.title}
            </h2>


            {/* DESCRIPTION */}

            <p className="mb-5 flex-1 text-sm leading-6 text-gray-500">
                {resource.description}
            </p>


            {/* BOTTOM */}

            <div className="border-t border-gray-100 pt-4">

                <p className="text-xs font-medium text-gray-700">
                    {resource.topic}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                    {resource.date}
                </p>

            </div>

        </article>
    );
}

export default ResourceCard;