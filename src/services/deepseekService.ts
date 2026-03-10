import { GameState, StoryStep } from "../types";

const callProxy = async (apiKey: string, messages: any[], response_format?: any) => {
  const response = await fetch("/api/deepseek", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      messages,
      response_format,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "请求失败");
  }

  return response.json();
};

export const generateInitialStory = async (apiKey: string, setting: string): Promise<StoryStep> => {
  console.log("Generating initial story for setting:", setting);
  try {
    const data = await callProxy(apiKey, [
      {
        role: "system",
        content: "你是一个硬核推理破案游戏的引擎。请使用中文生成生动的故事，并大量使用表情符号。在开始时，你必须在心中确定一个唯一的真相和凶手，并在后续过程中保持一致。结局必须是确定的，但玩家到达结局的过程是开放且灵活的。输出必须是JSON格式。"
      },
      {
        role: "user",
        content: `在以下设定中开始一场谋杀案调查：${setting}。
        请返回以下格式的JSON：
        {
          "text": "案发现场描述（包含表情）",
          "choices": ["调查动作1", "调查动作2", "调查动作3"],
          "inventory": ["初始调查工具"],
          "currentQuest": "当前调查目标",
          "theTruth": "案件的最终真相（凶手是谁，动机是什么，手法是什么。这部分不会展示给玩家，仅用于你保持逻辑一致）"
        }`
      }
    ], { type: 'json_object' });

    console.log("DeepSeek response received via proxy");
    const content = data.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("DeepSeek Proxy Error (Initial):", error);
    throw error;
  }
};

export const generateNextStep = async (
  apiKey: string,
  currentState: GameState,
  choice: string
): Promise<StoryStep> => {
  console.log("Generating next step for choice:", choice);
  try {
    const data = await callProxy(apiKey, [
      {
        role: "system",
        content: `你是一个硬核推理破案游戏的引擎。案件的最终真相是：${currentState.theTruth}。请确保所有的线索、人物对话和物证都指向这个真相。过程要有柔韧性，允许玩家以不同的方式调查。请大量使用表情符号。输出必须是JSON格式。`
      },
      {
        role: "user",
        content: `继续调查。
        当前故事进度：${currentState.story}
        当前收集的线索/物品：${currentState.inventory.join(", ")}
        当前调查目标：${currentState.currentQuest}
        玩家的调查动作：${choice}
        
        请返回以下格式的JSON：
        {
          "text": "调查结果描述（包含表情）",
          "choices": ["下一步调查动作1", "下一步调查动作2", "下一步调查动作3"],
          "inventory": ["更新后的线索/物品清单"],
          "currentQuest": "更新后的调查目标"
        }`
      }
    ], { type: 'json_object' });

    console.log("DeepSeek response received via proxy");
    const content = data.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("DeepSeek Proxy Error (Next):", error);
    throw error;
  }
};

export const chatWithNarrator = async (apiKey: string, history: any[], message: string) => {
  try {
    const data = await callProxy(apiKey, [
      {
        role: "system",
        content: "你是无限冒险的旁白。你对世界了如指掌，但只在必要时透露信息。保持神秘且乐于助人。请始终使用中文交流，并适当使用表情符号。"
      },
      ...history.map(h => ({
        role: (h.role === 'model' ? 'assistant' : 'user') as "assistant" | "user",
        content: h.parts[0].text
      })),
      { role: "user", content: message }
    ]);

    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek Proxy Error (Chat):", error);
    throw error;
  }
};
