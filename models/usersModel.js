const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 32,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    index: { unique: true },
    match: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
  },
  password: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
  },
  privateKey: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  cipher: {
    type: String,
    required: true,
  },
  userRole: {
    type: Number,
    required: true,
    enum: [0, 1]
  },
  clientIpAddress: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
  },
  userImage: {
    type: String,
    default: "user.png",
  },
  status: {
    type: String,
    default: "active",
    enum: [
      "active",
      "suspended"
    ]
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date
  },
  //you can use this to store IPs
  history: {
    type: Array,
    default: [],
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
},
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // "- 1000" here is waiting for the changedAt property to reflect
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, originalPassword) {
  return await bcrypt.compare(candidatePassword, originalPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + (10 * 60 * 1000);

  return resetToken;
};

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;