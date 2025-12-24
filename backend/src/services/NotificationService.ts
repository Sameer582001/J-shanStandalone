import SibApiV3Sdk from 'sib-api-v3-sdk';

export class NotificationService {
    private apiInstance;

    constructor() {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY || '';

        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    }

    async sendWelcomeEmail(email: string, name: string, mobile: string, password?: string) {
        console.log(`[NotificationService] Sending welcome email to ${email} (${name})`);

        const loginUrl = 'http://localhost:5173/login';

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: email, name: name }];
        sendSmtpEmail.sender = { email: "jshanenterprises@gmail.com", name: "J-Shan Support" };
        sendSmtpEmail.subject = "Welcome to J-Shan Network! 🚀";
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">Welcome to J-Shan!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hi ${name},</p>
                    <p>Welcome to J-Shan Network! Your account has been successfully created.</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Login ID (Mobile):</strong> ${mobile}</p>
                        ${password ? `<p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>` : ''}
                    </div>
                    <p>You can login to your dashboard using the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}" style="background-color: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
                    </div>
                </div>
            </div>
        `;

        try {
            await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`[NotificationService] Welcome email sent successfully to ${email}`);
        } catch (error) {
            console.error(`[NotificationService] Failed to send welcome email:`, error);
        }
    }

    async sendOtpEmail(email: string, code: string) {
        console.log(`[NotificationService] Sending OTP ${code} to ${email}`);

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: email }];
        sendSmtpEmail.sender = { email: "jshanenterprises@gmail.com", name: "J-Shan Security" };
        sendSmtpEmail.subject = "Your Verification Code";
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">Email Verification</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hello,</p>
                    <p>Please use the following verification code to complete your registration:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${code}</span>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            </div>
        `;

        try {
            await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`[NotificationService] OTP sent successfully to ${email}`);
        } catch (error) {
            console.error(`[NotificationService] Failed to send OTP:`, error);
        }
    }

    async sendAdminAlert(subject: string, message: string) {
        console.log(`[NotificationService] ADMIN ALERT: ${subject} - ${message}`);
    }
}
