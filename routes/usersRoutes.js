const express = require("express");
const router = express.Router();
const usersController = require("../controller/usersController");

router.get("/all-users", usersController.getAllUser);
router.post("/single-user", usersController.getSingleUser);

router.post("/add-user", usersController.postAddUser); //unused
router.post("/edit-user", usersController.postEditUser);
router.post("/delete-user", usersController.getDeleteUser); //unused

router.post("/activate-user", usersController.activateUser);
router.post("/suspend-user", usersController.suspendUser);

router.post("/change-password", usersController.changePassword);

module.exports = router;
