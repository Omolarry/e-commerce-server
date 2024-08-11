const mongoose = require("mongoose");

try {
  mongoose.connect(process.env.DATABASE_URI );
  console.log("Database Connected Successfully");
} catch (err) {
  console.log("Database Not Connected");
}
