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
        <article className="flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">

            {/* TOP */}

            <div className="mb-4 flex items-start justify-between gap-3">

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    SMS
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-xl">
                    💬
                </div>

            </div>


            {/* MESSAGE */}

            <div className="flex-1">

                <p className="text-sm leading-6 text-gray-700">
                    {message.text}
                </p>

            </div>


            {/* BOTTOM */}

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">

                <div>

                    <p className="text-xs font-medium text-gray-700">
                        Impiricus
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                        {formattedDate}
                    </p>

                </div>
            </div>

        </article>
    );
}

export default SmsCard;