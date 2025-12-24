
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function testBrevo() {
    console.log('Testing Brevo API...');
    const apiKeyVal = process.env.BREVO_API_KEY;
    console.log('API Key present:', !!apiKeyVal);
    if (apiKeyVal) console.log('API Key length:', apiKeyVal.length);

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = apiKeyVal;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.to = [{ email: "yellurkar121@gmail.com", name: "Test User" }]; // Sending to the user's email from the screenshot
    sendSmtpEmail.sender = { email: "jshanenterprises@gmail.com", name: "J-Shan Test" };
    sendSmtpEmail.subject = "Brevo API Test";
    sendSmtpEmail.htmlContent = "<p>This is a test email from the debug script.</p>";

    try {
        console.log('Sending email...');
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully. Data:', JSON.stringify(data));
    } catch (error: any) {
        console.error('Error sending email:');
        console.error(error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response body:', error.response.body);
        }
    }
}

testBrevo();
