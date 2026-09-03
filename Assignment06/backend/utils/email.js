import nodemailer from 'nodemailer';
import env from '../config/env.js';

export function isMailConfigured() {
    return Boolean(env.mail.user && env.mail.appPassword);
}

function transport() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: env.mail.user, pass: env.mail.appPassword },
    });
}

export async function sendOtpEmail(to, otp) {
    const mailer = transport();
    await mailer.sendMail({
        from: `"BlogSpace" <${env.mail.user}>`,
        to,
        subject: 'Your BlogSpace verification code',
        text:
            `Your BlogSpace verification code is: ${otp}\n\n` +
            `It expires in 10 minutes. If you did not request this, just ignore this email.`,
    });
}
