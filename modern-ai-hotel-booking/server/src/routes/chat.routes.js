import { Router } from "express";
import { chat } from "../services/chatService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const history = (req.body.messages || [])
      .filter((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-10);
    const reply = await chat(history, req.user?._id); // adjust to how your auth sets the user
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;