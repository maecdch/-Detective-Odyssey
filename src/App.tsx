/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Backpack, 
  Compass, 
  MessageSquare, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Key,
  Send
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  generateInitialStory, 
  generateNextStep, 
  chatWithNarrator
} from './services/deepseekService';
import { StoryStep, GameState } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentStep, setCurrentStep] = useState<StoryStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const startGame = async (setting: string = "暴风雪山庄：在一座孤岛别墅中，知名富豪在密室中离奇死亡 ❄️🏰") => {
    if (!apiKey) {
      alert("请先输入 DeepSeek API Key 🔑");
      return;
    }
    setIsLoading(true);
    setShowKeyInput(false);
    try {
      const initial = await generateInitialStory(apiKey, setting);
      setCurrentStep(initial);
      setGameState({
        story: initial.text,
        inventory: initial.inventory,
        currentQuest: initial.currentQuest,
        location: setting,
        theTruth: initial.theTruth || "未知"
      });
    } catch (error: any) {
      console.error("Failed to start game:", error);
      const errorMsg = error?.message || "未知错误";
      alert(`启动失败 ❌\n错误信息: ${errorMsg}\n\n请检查：\n1. API Key 是否正确\n2. 网络是否通畅\n3. 余额是否充足`);
      setShowKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choice: string) => {
    if (!gameState || isLoading || !apiKey) return;
    
    setIsLoading(true);
    try {
      const next = await generateNextStep(apiKey, gameState, choice);
      setCurrentStep(next);
      setGameState(prev => ({
        ...prev!,
        story: prev!.story + "\n\n" + next.text,
        inventory: next.inventory,
        currentQuest: next.currentQuest,
      }));
    } catch (error) {
      console.error("Failed to progress story:", error);
      alert("故事推进失败，请重试 🔄");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || !apiKey) return;

    const userMsg = chatInput;
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: userMsg }] }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const response = await chatWithNarrator(apiKey, newHistory, userMsg);
      setChatHistory([...newHistory, { role: "model", parts: [{ text: response || "" }] }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E4E3E0] font-sans flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-[#050505] flex flex-col h-auto lg:h-screen">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold italic tracking-tighter uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            无限奥德赛
          </h1>
          <button 
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Key className={cn("w-4 h-4", apiKey ? "text-green-500" : "text-zinc-500")} />
          </button>
        </div>

        {showKeyInput && (
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
            <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">DeepSeek API Key</label>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
              <Compass className="w-4 h-4" />
              当前任务 🎯
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm leading-relaxed text-zinc-300 italic">
                {gameState?.currentQuest || "等待旅程开启..."}
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
              <Backpack className="w-4 h-4" />
              物品栏 🎒
            </div>
            <div className="space-y-2">
              {gameState?.inventory.length ? (
                gameState.inventory.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                    {item}
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 italic">空空如也...</p>
              )}
            </div>
          </section>

          <section className="flex flex-col h-64 lg:h-auto">
            <div className="flex items-center gap-2 mb-4 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
              <MessageSquare className="w-4 h-4" />
              旁白的低语 🎙️
            </div>
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 overflow-y-auto mb-3 space-y-3 min-h-[150px]">
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "text-xs leading-relaxed p-2 rounded-lg",
                  msg.role === 'user' ? "bg-zinc-800 ml-4 text-zinc-300" : "bg-blue-950/20 mr-4 text-blue-200 border border-blue-900/30"
                )}>
                  {msg.parts[0].text}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="向旁白提问..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 px-4 text-xs focus:outline-none focus:border-blue-500 pr-10"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-500">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden bg-[#050505]">
        <div className="flex-1 flex flex-col p-6 lg:p-12 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar">
          {!gameState ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none mb-4">
                  神探<br />
                  <span className="text-blue-600">奥德赛</span>
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8">
                  真相只有一个，但通往真相的路有千万条。🔍<br/>
                  请先在左侧输入 DeepSeek API Key。
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => startGame()}
                    disabled={isLoading}
                    className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "开始调查 🕵️‍♂️"}
                  </button>
                  <button 
                    onClick={() => startGame("东方快车：在一列疾驰的蒸汽火车上，一名乘客在反锁的车厢内被刺杀 🚂🔪")}
                    disabled={isLoading}
                    className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 font-bold rounded-full hover:border-blue-500 transition-all disabled:opacity-50"
                  >
                    随机案件 🎲
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 mb-8" ref={scrollRef}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={currentStep?.text}
                  className="prose prose-invert max-w-none"
                >
                  <div className="text-2xl lg:text-4xl font-serif leading-relaxed text-zinc-100">
                    <Markdown>{currentStep?.text || ""}</Markdown>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
                {currentStep?.choices.map((choice, i) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={i}
                    onClick={() => handleChoice(choice)}
                    disabled={isLoading}
                    className="group relative p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:border-blue-500 hover:bg-zinc-900 transition-all disabled:opacity-50"
                  >
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 group-hover:text-blue-500">
                      抉择 {i + 1}
                    </div>
                    <div className="text-sm font-medium text-zinc-200 leading-snug">
                      {choice}
                    </div>
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </motion.button>
                ))}
                {isLoading && (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}} />
    </div>
  );
}
