
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function checkAccount() {
    console.log('Checking Brevo Account Senders...');
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.AccountApi();
    const sendersApi = new SibApiV3Sdk.SendersApi();

    try {
        console.log('Fetching Senders...');
        const data = await sendersApi.getSenders();
        console.log('Senders:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('Error fetching senders:', error);
    }
}

checkAccount();
