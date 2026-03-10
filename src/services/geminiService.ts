import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GameState {
  story: string;
  inventory: string[];
  currentQuest: string;
  location: string;
  characterDescription: string;
  artStyle: string;
}

export interface StoryStep {
  text: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  imagePrompt: string;
}

export const generateInitialStory = async (setting: string): Promise<StoryStep> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `在以下设定中开始一个新的文字冒险游戏：${setting}。
    提供初始故事文本、3个可能的选项、初始物品栏（空或基础物品）、当前任务，以及场景图像的描述性提示词。
    保持艺术风格一致：“高细节数字概念艺术，电影级光影，鲜艳但忧郁的色彩”。
    请务必使用中文生成故事、选项和任务。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "故事文本，使用中文" },
          choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "选项列表，使用中文" },
          inventory: { type: Type.ARRAY, items: { type: Type.STRING }, description: "物品名称，使用中文" },
          currentQuest: { type: Type.STRING, description: "当前任务描述，使用中文" },
          imagePrompt: { type: Type.STRING, description: "图像生成提示词，使用英文以获得更好效果" },
          characterDescription: { type: Type.STRING, description: "主角的连贯描述，用于后续图像生成，使用英文" }
        },
        required: ["text", "choices", "inventory", "currentQuest", "imagePrompt", "characterDescription"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateNextStep = async (
  currentState: GameState,
  choice: string
): Promise<StoryStep> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `继续故事。
    当前故事：${currentState.story}
    当前物品栏：${currentState.inventory.join(", ")}
    当前任务：${currentState.currentQuest}
    用户选择：${choice}
    角色描述：${currentState.characterDescription}
    艺术风格：${currentState.artStyle}

    提供下一段故事、3个新选项、更新后的物品栏、更新后的任务，以及新场景的图像提示词。
    确保角色基于描述保持一致。
    请务必使用中文生成故事、选项和任务。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "故事文本，使用中文" },
          choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "选项列表，使用中文" },
          inventory: { type: Type.ARRAY, items: { type: Type.STRING }, description: "物品名称，使用中文" },
          currentQuest: { type: Type.STRING, description: "当前任务描述，使用中文" },
          imagePrompt: { type: Type.STRING, description: "图像生成提示词，使用英文以获得更好效果" }
        },
        required: ["text", "choices", "inventory", "currentQuest", "imagePrompt"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateSceneImage = async (prompt: string, size: "1K" | "2K" | "4K"): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
            aspectRatio: "16:9",
            imageSize: size
        },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const chatWithNarrator = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "你是无限冒险的旁白。你对世界了如指掌，但只在必要时透露信息。保持神秘且乐于助人。请始终使用中文交流。",
    },
    history: history
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const getQuickHint = async (story: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `根据这段故事，给出一个非常简短、神秘的提示（最多15个字）：${story}`,
  });
  return response.text;
};
