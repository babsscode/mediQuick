import type { SmsMessage } from "../types";

type SmsCardProps = {
    message: SmsMessage;
};

function SmsCard({ message }: SmsCardProps) {
    const date = message.createdAt.toDate();

    return (
        <article className="sms-card">

            <div className="sms-card-header">

                <span className="sms-label">
                    SMS
                </span>

                <time>
                    {date.toLocaleDateString()}
                </time>

            </div>

            <div className="sms-card-body">

                <p>
                    {message.text}
                </p>

            </div>

        </article>
    );
}

export default SmsCard;
