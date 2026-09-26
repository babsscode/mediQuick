import type { SmsMessage } from "../types";

type SmsCardProps = {
    message: SmsMessage;
};

function SmsCard({ message }: SmsCardProps) {
    const date = message.createdAt.toDate();

    return (
        <article className="flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">

            <div className="mb-4 flex items-center justify-between">

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    SMS
                </span>

                <time className="text-xs text-gray-400">
                    {date.toLocaleDateString()}
                </time>

            </div>

            <div className="flex-1">

                <p className="text-sm leading-6 text-gray-700">
                    {message.text}
                </p>

            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">

                <span className="text-xs font-medium text-gray-400">
                    Impiricus
                </span>

            </div>

        </article>
    );
}

export default SmsCard;