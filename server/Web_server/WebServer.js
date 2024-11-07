const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const pool = mysql.createPool({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "0000",
  database: "EmojiDB",
});

app.get("/api/users", (req, res) => {
  const directoryPath = "E:/GitHub/EmojiYOLO/3_YOLO_FaceNet/dataset";
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan directory: " + err);
    }
    res.json(files);
  });
});

app.get("/home", (req, res) => {
  const userID = req.cookies.userID;
  res.sendFile(path.join(__dirname, "..", "src", "Home", "HomePage.js"));
});

app.post("/login", async (req, res) => {
  const id = req.body.id;
  const pw = req.body.pw;

  // 요청이 들어온 id와 pw를 콘솔에 출력
  console.log("Received ID:", id);
  console.log("Received PW:", pw);

  if (!id || !pw) {
    res.status(400).json({ error: "ID와 PW를 모두 입력하세요." });
    return;
  }

  res.locals.id = id;

  try {
    const conn = await pool.getConnection();
    const query = "SELECT * FROM users WHERE user_id = ? AND user_pw = ?";
    const [rows] = await conn.query(query, [id, pw]);
    const userNumQuery = "SELECT user_num FROM users WHERE user_id = ?";
    const [userNumRows] = await conn.query(userNumQuery, [id]);
    const userNum = userNumRows[0].user_num;
    console.log("userNumRows:", userNumRows);
    console.log("userNum:", userNum);
    conn.release();

    if (rows.length > 0) {
      const userNum = userNumRows[0].user_num;
      res
        .status(200)
        .json({ message: "Login successful", userNum, userID: id });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "signup.html"));
});

app.post("/signup", async (req, res) => {
  const id = req.body.id;
  const pw = req.body.pw;

  if (!id || !pw) {
    res.status(400).json({ error: "ID와 PW를 모두 입력하세요." });
    return;
  }

  try {
    const conn = await pool.getConnection();
    const query = "INSERT INTO users (user_id, user_pw) VALUES (?, ?)";
    const [result] = await conn.query(query, [id, pw]);
    conn.release();

    if (result.affectedRows > 0) {
      res.redirect("/index");
    } else {
      res.status(500).json({ error: "Failed to insert user information" });
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/changePW", async (req, res) => {
  const id = req.body.id;
  const newpw = req.body.pw;

  // 요청이 들어온 id와 pw를 콘솔에 출력
  console.log("Received ID:", id);
  console.log("Received PW:", newpw);

  if (!newpw) {
    console.error("새로운 PW를 입력하세요.");
    res.status(400).json({ error: "새로운 PW를 입력하세요." });
    return;
  }

  try {
    const conn = await pool.getConnection();
    const query = "UPDATE users SET user_pw = ? WHERE user_id = ?";
    const [result] = await conn.query(query, [newpw, id]);
    conn.release();

    if (result.affectedRows > 0) {
      console.log("비밀번호 변경이 완료되었습니다!");
      res.status(200).json({ message: "비밀번호 변경이 완료되었습니다!" });
    } else {
      console.error("Failed to insert new password");
      res.status(500).json({ error: "Failed to insert new password" });
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/changeSK", async (req, res) => {
  const id = req.body.id;
  const newsk = req.body.sk;

  // 요청이 들어온 id와 pw를 콘솔에 출력
  console.log("Received ID:", id);
  console.log("Received Steamkey:", newsk);

  if (!newsk) {
    console.error("새로운 StreamKey를 입력하세요.");
    res.status(400).json({ error: "새로운 StreamKey를 입력하세요." });
    return;
  }

  try {
    const conn = await pool.getConnection();
    const query = "UPDATE users SET streamkey = ? WHERE user_id = ?";
    const [result] = await conn.query(query, [newsk, id]);
    conn.release();

    if (result.affectedRows > 0) {
      console.log("스트림키 변경/등록이 완료되었습니다!");
      res.status(200).json({ message: "스트림키 변경/등록이 완료되었습니다!" });
    } else {
      console.error("Failed to insert new streamkey");
      res.status(500).json({ error: "Failed to insert new streamkey" });
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(8000, () => {
  console.log("Server started");
});
