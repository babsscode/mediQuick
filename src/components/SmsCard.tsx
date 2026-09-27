import type { SmsMessage } from "../types";

type SmsCardProps = {
    message: SmsMessage;
};

function SmsCard({ message }: SmsCardProps) {
    const date = message.createdAt.toDate();

    const formattedDate = date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );

    return (
        <article className="flex min-h-48 flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-mist hover:shadow-md">

            {/* TOP */}

            <div className="mb-4 flex items-start justify-between gap-3">

                <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink">
                    SMS
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-xl">
                    💬
                </div>

            </div>


            {/* MESSAGE */}

            <div className="flex-1">

                <p className="text-sm leading-6 text-ink">
                    {message.text}
                </p>

            </div>


            {/* BOTTOM */}

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">

                <div>

                    <p className="text-xs font-medium text-ink">
                        Impiricus
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        {formattedDate}
                    </p>

                </div>
            </div>

        </article>
    );
}

export default SmsCard;
