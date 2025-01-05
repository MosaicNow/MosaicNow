const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const streamingkeyRoutes = require("./routes/streamingkey");

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
    origin: 'http://110.9.11.9:3000',  // 허용할 출처를 명시적으로 설정
    methods: 'GET, POST, PUT, DELETE',  // 허용할 HTTP 메소드
    allowedHeaders: 'Content-Type, Authorization',  // 허용할 헤더
    credentials: true  // 쿠키와 인증 정보 허용
  };
  
  app.use(cors(corsOptions));  // CORS 미들웨어 사용
  

app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/streamingkey", streamingkeyRoutes);

app.listen(PORT, () => {
  console.log(`Web server is running on port ${PORT}`);
});
