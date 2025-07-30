function generateEmailTemplate(verificationLink) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #444;">Email Verification</h2>
            <p>Thank you for registering!</p>
            <p>Please click the button below to verify your email address:</p>
            <p style="text-align: center; margin: 25px 0;">
                <a href="${verificationLink}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Verify Email
                </a>
            </p>
            <p style="font-size: 12px; color: #777;">If the button doesn't work, copy and paste this link into your browser: <br>
            <a href="${verificationLink}">${verificationLink}</a></p>
        </div>
    `;
}

module.exports = {
    generateEmailTemplate,
};