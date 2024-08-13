const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async options => {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.sender = { email: 'seyiakintoye7@gmail.com', name: 'Tomicare' }; // Replace with your verified sender
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.message;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


module.exports = sendEmail;
