import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test route works!" });
});

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    console.log(API_KEY);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    console.log("Response from OpenAI:", response);
    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Error communicating with OpenAI API:", error.message);
    res.status(500).json({ error: "Failed to fetch response from OpenAI" });
  }
});

// Move app.listen() to the root level, outside of any route handlers
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Optional: Log API key for debugging (remove in production)
console.log(`API Key loaded: ${API_KEY ? "Yes" : "No"}`);
