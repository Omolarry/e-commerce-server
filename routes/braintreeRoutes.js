const express = require("express");
const router = express.Router();
const brainTreeController = require("../controller/braintreeController");

router.post("/get-token", brainTreeController.generateToken);
router.post("/payment", brainTreeController.paymentProcess);

module.exports = router;
