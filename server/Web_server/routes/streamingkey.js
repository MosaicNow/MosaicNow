const express = require("express");
const db = require("../config/config"); // DB 설정 파일 가져오기
const router = express.Router();

// StreamKey 업데이트 API
router.post("/update-streamkey", async (req, res) => {
    const { user_id, streamKey } = req.body;

    if (!user_id || !streamKey) {
        return res.status(400).json({ message: "Missing user_id or streamKey" });
    }

    try {
        const query = "UPDATE user SET streamkey = ? WHERE user_id = ?";
        const [result] = await db.query(query, [streamKey, user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "StreamKey updated successfully" });
    } catch (error) {
        console.error("Error updating streamKey:", error);
        res.status(500).json({ message: "Database error" });
    }
});

router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
        const query = "SELECT streamkey FROM user WHERE user_id = ?";
        const [rows] = await db.query(query, [user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const streamKey = rows[0].streamkey || "";
        res.json({ streamKey });
    } catch (error) {
        console.error("Error fetching streamKey:", error);
        res.status(500).json({ message: "Database error" });
    }
});


module.exports = router;
