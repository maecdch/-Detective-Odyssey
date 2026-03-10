import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
  }));
  app.use(express.json({ limit: '10kb' })); // Limit body size

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: "请求过于频繁，请稍后再试" }
  });
  app.use("/api/", limiter);

  // API routes
  app.post("/api/deepseek", async (req, res) => {
    const { apiKey, messages, response_format } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-')) {
      return res.status(400).json({ error: "无效的 API Key 格式" });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "无效的请求消息格式" });
    }

    try {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.deepseek.com",
      });

      const response = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: messages,
        response_format: response_format,
        temperature: 0.7,
        max_tokens: 2000,
      });

      res.json(response);
    } catch (error: any) {
      // Don't log the full error to avoid leaking sensitive info in logs
      console.error("DeepSeek Proxy Error:", error.message);
      res.status(error.status || 500).json({ 
        error: error.message || "DeepSeek API 调用失败",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
