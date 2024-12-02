const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const db = require("../config/config");
const router = express.Router();

router.post("/kakao-login", async (req, res) => {
    const { code } = req.body;

    try {
        // Step 1: Get access token from Kakao
        const tokenResponse = await axios.post("https://kauth.kakao.com/oauth/token", null, {
            params: {
                grant_type: "authorization_code",
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code,
            },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const { access_token } = tokenResponse.data;

        // Step 2: Get user info from Kakao
        const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { nickname } = userResponse.data.properties;
        const email = userResponse.data.kakao_account.email;

        // Step 3: Insert or update user info in DB
        const queryInsert = `
            INSERT INTO user (user_name, email) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE user_name = VALUES(user_name)
        `;
        await db.query(queryInsert, [nickname, email]);

        const [rows] = await db.query("SELECT user_id FROM user WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(500).json({ error: "User not found" });
        }

        const userId = rows[0].user_id;

        // Step 4: Create JWT token
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Step 5: Set cookies (accessible in the browser)
        res.cookie("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
        res.cookie("user_id", userId, { httpOnly: false, secure: process.env.NODE_ENV === "production" }); // 일반 쿠키 설정

        res.json({ message: "Login successful", userId });
    } catch (error) {
        console.error("Kakao login error:", error);
        res.status(500).json({ error: "Kakao login failed" });
    }
});


module.exports = router;
