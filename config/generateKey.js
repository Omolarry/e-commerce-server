const crypto = require("crypto");
const key = crypto.randomBytes(32).toString("hex");
console.log(key); // Save this key in your .env file


//run node generateKey.js when in this directory