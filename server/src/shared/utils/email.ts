import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({
    to,
    subject,
    html,
}: SendEmailParams) => {
    try {
        const data = await resend.emails.send({
            from: "Your App <onboarding@resend.dev>",
            to,
            subject,
            html,
        });

        return data;
    } catch (error) {
        console.error("Email error:", error);
        throw new Error("Failed to send email");
    }
};