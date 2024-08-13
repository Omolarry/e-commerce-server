const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sodium = require('libsodium-wrappers');
const bcrypt = require('bcryptjs');
const randomize = require('randomatic');
const { toTitleCase, validateEmail } = require("../config/function");
const { encrypt } = require('../config/encryption');
const userModel = require("../models/usersModel");
const SendEmail = require("../config/email");
const sendOTPEmail = require("../config/otp");
const Fraud = require("../config/fraud");



class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUserRole.userRole });
    } catch {
      res.status(404);
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404);
    }
  }

  /* User Registration/Signup controller  */
  async postSignup(req, res) {
    const clientIpAddress = req.socket.remoteAddress;
    // console.log("Client IP Address(sign-up):", clientIp);
    let { name, email, password, cPassword } = req.body;
    let error = {};
    if (!name || !email || !password || !cPassword) {
      error = {
        ...error,
        name: "Required field cannot be empty",
        email: "Required field cannot be empty",
        password: "Required field cannot be empty",
        cPassword: "Required field cannot be empty",
      };
      return res.status(400).json({ error });
    }
    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be at least 3 characters long" };
      return res.status(400).json({ error });
    } else {
      if (validateEmail(email)) {
        name = toTitleCase(name);
        if ((password.length > 255) || (password.length < 8) || (password !== cPassword)) {
          error = {
            ...error,
            password: "Password must be 8 characters long",
            cPassword: "Passwords do not match",
            name: "",
            email: "",
          };
          return res.status(400).json({ error });
        } else {
          try {
            const data = await userModel.findOne({ email: email });
            if (data) {
              error = {
                ...error,
                password: "",
                name: "",
                email: "User already exists",
              };
              return res.status(400).json({ error });
            } else {
              await sodium.ready;
              const hashedPassword = await bcrypt.hash(password, 10);
              const { publicKey, privateKey } = sodium.crypto_box_keypair();
              const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
              const cipher = sodium.crypto_box_easy(hashedPassword, nonce, publicKey, privateKey);
              const cipherHex = Buffer.from(cipher).toString('hex'); // Ensure conversion to hex

              const encryptedPrivateKey = encrypt(privateKey);
              let newUser = new userModel({
                name,
                email,
                password,
                publicKey: Buffer.from(publicKey).toString('hex'),
                privateKey: encryptedPrivateKey,
                nonce: Buffer.from(nonce).toString('hex'),
                cipher: cipherHex,
                clientIpAddress,
                userRole: 0
              });
              newUser
                .save()
                .then((data) => {
                  return res.json({
                    success: "Account created successfully. Please login",
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          } catch (err) {
            console.log(err);
          }
        }
      } else {
        error = {
          ...error,
          password: "",
          name: "",
          email: "Email is not valid",
        };
        return res.status(500).json({ error });
      }
    }
  }



  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: "Fields must not be empty",
      });
    }

    try {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.json({
          error: "User not found, please sign up",
        });
      }

      if (user.status === "suspended") {
        return res.json({
          error: "Account temporarily suspended, please contact admin.",
        });
      }

      // Do check for IP here
      const clientIpAddress = req.socket.remoteAddress;
      const loginCheck = await Fraud.loginCheck(user.clientIpAddress, clientIpAddress, user._id);

      if (!loginCheck || loginCheck !== true) {
        return res.json({
          error: "Unauthorized login, please contact admin.",
        });
      }

      // Compare the provided password with the stored hashed password
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (isPasswordCorrect) {
        // Generate and send OTP
        const generatedOtp = randomize('0', 6);
        user.otp = generatedOtp;
        user.otpExpires = Date.now() + (5 * 60 * 1000); // Expires in 5 mins
        await user.save({ validateBeforeSave: false });
        sendOTPEmail(user.email, generatedOtp);

        // Generate token
        const token = jwt.sign(
          { _id: user._id, role: user.userRole },
          process.env.JWT_SECRET
        );
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({
          success: true,
          token,
          user: decoded,
        });
      } else {
        return res.json({
          error: "Invalid credentials",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "An error occurred" });
    }
  }


  //check OTP
  async postVerifyOtp(req, res) {
    let { otp } = req.body;
    if (!otp) {
      return res.json({ error: "Field can not be empty" });
    }
    try {
      const user = await userModel.findOne({
        otp: otp,
        otpExpires: { $gt: Date.now() }
      });
      if (!user) {
        return res.json({ error: "OTP is invalid or has expired" });
      }
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.json({ success: true });
    } catch (err) {
      return res.json({ error: "There was an error verifying the OTP." });
    }
  }


  //send reset token
  async postForgotPassword(req, res) {
    let { email } = req.body;
    if (!email) {
      return res.json({ error: "Field can not be empty" });
    }
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.json({ error: "User not found" });
      }
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });


      const clientURL = process.env.REACT_APP_URL;
      const resetURL = `${clientURL}/reset-password/${resetToken}`;
      const message = `Forgot your password? Follow this link to reset it: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

      await SendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 minutes)",
        message
      });

      res.status(200).json({
        success: "Reset token sent to email address."
      });
    } catch (err) {
      console.log(err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.json({ error: "There was an error sending the email. Please try again later or contact admin" });
    }
  }


  //reset user password
  async patchResetPassword(req, res) {
    let { password, cPassword } = req.body;
    let error = {};
    if (!password || !cPassword) {
      return res.json({ error: "Required fields can not be empty" });
    }
    if ((password.length > 255) || (password.length < 8) || (password !== cPassword)) {
      error = {
        ...error,
        password: "Password must be 8 characters long",
        cPassword: "Passwords do not match",
      };
      return res.json({ error });
    }
    try {
      const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
      const user = await userModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.json({ error: "Token is invalid or has expired" });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json({
        success: "Password reset. Please login with new password."
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "An error occurred" });
    }
  }
};


const authController = new Auth();
module.exports = authController;
