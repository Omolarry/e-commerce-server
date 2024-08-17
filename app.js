require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Import Routers
const authRouter = require("./routes/authRoutes");
const categoryRouter = require("./routes/categoriesRoutes");
const productRouter = require("./routes/productsRoutes");
const brainTreeRouter = require("./routes/braintreeRoutes");
const orderRouter = require("./routes/ordersRoutes");
const usersRouter = require("./routes/usersRoutes");
const customizeRouter = require("./routes/customizeRoutes");
const CreateAllFolder = require("./config/uploadFolderCreateScript");

/* Create All Uploads Folder if not exists | For Uploading Images */
CreateAllFolder();

// Database Connection
mongoose
  .connect(process.env.DATABASE_URI,  { useUnifiedTopology: true })
  .then(() =>
    console.log(
      "Mongodb Connected Successfully"
    )
  )
  .catch((err) => console.log("Database Not Connected !!!", err.message));

// Middleware
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", usersRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/braintree", brainTreeRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/customize", customizeRouter);

// Run Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
