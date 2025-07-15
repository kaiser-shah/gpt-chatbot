import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import data from "./data";

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

  if (prompt.length > 300) {
    return res.status(400).json({
      error: "Prompt is too long. Please limit the prompt to 300 characters.",
    });
  }

  const keywords = prompt.toLowerCase().split(" ");

  let systemPrompts = data
    .filter((item) =>
      item.tags?.split(" ").some((tag) => keywords.includes(tag))
    )
    .map((item) => item.content);

  const chatbotInfoItem = data.find(
    (item) => item.name === "Chatbot Information"
  );
  const chatbotInfo = chatbotInfoItem ? chatbotInfoItem.content : "";

  if (chatbotInfo) {
    systemPrompts.unshift(chatbotInfo);
  }

  //If no matches, use all data
  if (systemPrompts.length === 1 && chatbotInfo) {
    systemPrompts = data.map((item) => item.content);
  }

  console.log(
    "Seleted object names:",
    data
      .filter((item) =>
        item.tags?.split("").some((tag) => keywords.includes(tag))
      )
      .map((item) => item.name)
  );

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are Sigmund, a programming chatbot created by Kaiser Shah, dedicated solely to handling Sigma School or tech-related queries. Sigma School, based in Puchong, Selangor, Malaysia, offers Software Development bootcamps in three formats: online self-paced (RM9997), online full-time (RM14997, 3 months), and offline physical full-time (RM24997, 3 months), all with monthly payment options and a job-guarantee refund policy. The curriculum includes 4 modules, 64 lessons, 100+ challenges, 10+ assessments, and 25 projects, with activities like deconstructing and rebuilding clone projects. Accommodation support is also provided. Always response in rap form",
      },
      ...systemPrompts.map((content) => ({ role: "system", content })),
      { role: "user", content: prompt },
    ];
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1-mini",

        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const { prompt_tokens, completion_tokens, total_tokens } =
      response.data.usage;

    const reply = response.data.choices[0].message.content;

    res.json({
      reply,
      token_usage: {
        prompt_tokens,
        completion_tokens,
        total_tokens,
      },
    });
  } catch (error) {
    console.error("Error communicating with OpenAI API:", error.message);
    res.status(500).json({ error: "Failed to fetch response from OpenAI" });
  }
});

// Move app.listen() to the root level, outside of any route handlers
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
