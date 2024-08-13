const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendOTPEmail = async (recipientEmail, otp) => {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: recipientEmail }];
    sendSmtpEmail.sender = { email: 'seyiakintoye7@gmail.com', name: 'Tomicare' }; // Replace with your verified sender
    sendSmtpEmail.subject = 'Your OTP Code(valid for 5 minutes.)';
    sendSmtpEmail.textContent = `Your OTP code is: ${otp}`;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};


module.exports = sendOTPEmail;
