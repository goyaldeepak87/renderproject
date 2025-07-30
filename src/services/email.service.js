const nodemailer = require('nodemailer');
const { generateEmailTemplate } = require('../EmailTemplate/EmailVerification');

/**
 * Sends a verification email to the specified email address
 * @param {string} email - The recipient's email address
 * @param {string} id - The user ID for verification
 * @returns {Promise<object>} - Information about the sent email
 */
const sendVerificationEmail = async (email, projectName, inviteUrl) => {
    try {
        // Create a transporter object with environment variables
        console.log({
            APP_NAME: process.env.APP_NAME,
            MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
            MAIL_USERNAME: process.env.MAIL_USERNAME,
            MAIL_PASSWORD: process.env.MAIL_PASSWORD,
            MAIL_HOST: process.env.MAIL_HOST
        });
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false, // false for port 587
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        // Verify connection configuration before sending
        await transporter.verify();
        // Create verification link with user ID
        // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?id=${id}`;
        const verificationLink = `${process.env.FRONTEND_URL}/${inviteUrl}`;

        // Define and send email content
        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: email,
            subject: "Email Verification",
            html: generateEmailTemplate(verificationLink), // Use the email template function
        });

        console.log("Email sent successfully! Message ID:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
};