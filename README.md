# 🕵️‍♂️ 无限奥德赛 (Infinite Odyssey)

> **真相只有一个，但通往真相的路有千万条。**

这是一个基于 **DeepSeek-V3** 驱动的硬核推理破案游戏引擎。玩家将扮演一名侦探，在随机生成的案件中寻找线索、审问嫌疑人，并最终揭开真相。

---

## ✨ 核心特性

- **🤖 动态叙事**：由 DeepSeek 强力驱动，每一场案件的细节、线索和对话都是实时生成的。
- **🧩 逻辑严密**：AI 在开局时即确定“终极真相”，确保所有后续线索逻辑自洽。
- **🎙️ 旁白系统**：内置“旁白的低语”，你可以随时向神秘的旁白提问，获取模糊的提示或世界观补充。
- **🎒 沉浸式 UI**：采用极简主义技术仪表盘风格，支持物品栏管理和任务追踪。
- **🛡️ 安全代理**：后端集成安全代理层，保护 API 调用并处理跨域限制。

---

## 🚀 快速开始

### 1. 环境准备
确保你的环境中已安装 Node.js。

### 2. 获取 API Key
访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取你的 `API_KEY`。

### 3. 运行应用
```bash
npm install
npm run dev
```

---

## 🛠️ 技术栈

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Express + tsx
- **AI Model**: DeepSeek-V3 (via OpenAI SDK)
- **Animation**: Motion (Framer Motion)
- **Icons**: Lucide React

---

## 🔒 安全说明

本项目已实施以下安全措施：
- **API 代理**：所有敏感请求均通过后端中转，避免 API Key 在浏览器控制台直接暴露（虽然由用户输入，但传输过程加密）。
- **速率限制**：后端集成 `express-rate-limit` 防止暴力破解和接口滥用。
- **安全响应头**：使用 `helmet` 保护应用免受常见的 Web 漏洞攻击。

---

## 📜 许可

本项目采用 Apache-2.0 许可证。
