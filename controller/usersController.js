const userModel = require("../models/usersModel");
const bcrypt = require("bcryptjs");

class User {
  async getAllUser(req, res) {
    try {
      let Users = await userModel
        .find({ userRole: 0 })
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .select("-password -publicKey -privateKey -nonce -cipher -passwordResetExpires -passwordResetToken -otp -otpExpires")
        .sort({ _id: -1 });
      if (Users) {
        return res.json({ result: Users.length, Users });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getSingleUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ error: "Field can not be empty" });
    } else {
      try {
        let User = await userModel
          .findById(uId)
          .select("name email phoneNumber userImage updatedAt createdAt");
        if (!User) {
          return res.json({ User });
        }
        return res.json({ User });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postAddUser(req, res) {
    let { allProduct, user, amount, transactionId, address, phone } = req.body;
    if (!allProduct || !user || !amount || !transactionId || !address || !phone) {
      return res.json({ message: "All fields are required" });
    } else {
      try {
        let newUser = new userModel({
          allProduct,
          user,
          amount,
          transactionId,
          address,
          phone,
        });
        let save = await newUser.save();
        if (save) {
          return res.json({ success: "User created successfully" });
        }
      } catch (err) {
        return res.json({ error: error });
      }
    }
  }

  async postEditUser(req, res) {
    let { uId, name, phoneNumber } = req.body;
    if (!uId || !name || !phoneNumber) {
      return res.json({ message: "All fields are required" });
    } else {
      let currentUser = userModel.findByIdAndUpdate(uId, {
        name: name,
        phoneNumber: phoneNumber,
        updatedAt: Date.now(),
      });
      currentUser.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "User updated successfully" });
      });
    }
  }

  async getDeleteUser(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All fields are required" });
    } else {
      let currentUser = userModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now(),
      });
      currentUser.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "User updated successfully" });
      });
    }
  }

  async changePassword(req, res) {
    let { uId, oldPassword, newPassword } = req.body;
    if (!uId || !oldPassword || !newPassword) {
      return res.json({ message: "All fields are required" });
    } else {
      const data = await userModel.findOne({ _id: uId });
      if (!data) {
        return res.json({
          error: "Invalid user",
        });
      } else {
        const oldPassCheck = await bcrypt.compare(oldPassword, data.password);
        if (oldPassCheck) {
          newPassword = bcrypt.hashSync(newPassword, 10);
          let passChange = userModel.findByIdAndUpdate(uId, {
            password: newPassword,
          });
          passChange.exec((err, result) => {
            if (err) console.log(err);
            return res.json({ success: "Password updated successfully" });
          });
        } else {
          return res.json({
            error: "Your old password is wrong. Try again or reset it.",
          });
        }
      }
    }
  }

  async suspendUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: "Field is required" });
    }
    const user = await userModel.findOne({ _id: uId });
    if (!user) {
      return res.json({
        error: "User not found",
      });
    }
    try {
      user.status = "suspended";
      await user.save({ validateBeforeSave: false });
      return res.status(200).json({ success: "User suspended!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  }

  async activateUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: "Field is required" });
    }
    const user = await userModel.findOne({ _id: uId });
    if (!user) {
      return res.json({
        error: "User not found",
      });
    }
    try {
      user.status = "active";
      await user.save({ validateBeforeSave: false });
      return res.status(200).json({ success: "User activated!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  }
}

const ordersController = new User();
module.exports = ordersController;