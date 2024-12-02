const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const streamingkeyRoutes = require("./routes/streamingkey"); // 파일 이름과 변수 이름 일치

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/streamingkey", streamingkeyRoutes); // 올바른 경로 지정

// Start the server
app.listen(PORT, () => {
    console.log(`Web server is running on port ${PORT}`);
});
