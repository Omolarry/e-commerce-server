const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });


    const mailOptions = {
        from: "Oluwaseyi Akintoye <seyiakintoye7@gmail.com>",
        to: email,
        subject: "OTP Verification(valid for 5 minutes)",
        text: `Your OTP is: ${otp}`
    }

    await transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;