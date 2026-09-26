import type { SmsMessage } from "../types";

interface SmsCardProps {
    message: SmsMessage;
}

function SmsCard({ message }: SmsCardProps) {

    const formattedDate = message.date.toDate().toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

    return (
        <div className="sms-card">

            <div className="sms-card-header">

                <div>
                    <h3>{message.title}</h3>
                    <p className="sms-sender">
                        {message.sender}
                    </p>
                </div>

                <span className="sms-date">
                    {formattedDate}
                </span>

            </div>

            <span className="drug-tag">
                {message.drug}
            </span>

            <p className="sms-body">
                {message.body}
            </p>

            {message.link && (
                <a
                    href={message.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sms-link"
                >
                    View resource →
                </a>
            )}

        </div>
    );
}

export default SmsCard;