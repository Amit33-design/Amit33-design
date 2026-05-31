"use client";
import { useState, useRef, useEffect } from "react";
import { api, resolveUserId } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Why was oats recommended for me?",
  "What foods should I avoid and why?",
  "Explain my protein target",
  "How does my diet support diabetes management?",
  "What are the best high-protein vegetarian options?",
  "How much water should I drink daily?",
  "Can I eat spinach with kidney stones?",
  "What exercises are safe for hypertension?",
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your healthCopilot AI. I'm aware of your health conditions, goals, and today's meal plan. Ask me anything about your nutrition, exercise, or lifestyle recommendations — I'll explain the science behind every suggestion.\n\n**Note:** I provide educational information, not medical advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = resolveUserId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const thinkingMsg: Message = { id: "thinking", role: "assistant", content: "..." };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const response = await api.chat(userId, text, sessionId) as {
        session_id: string;
        response: string;
      };
      setSessionId(response.session_id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === "thinking"
            ? { ...m, id: Date.now().toString(), content: response.response }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === "thinking"
            ? { ...m, id: Date.now().toString(), content: "Sorry, I'm having trouble connecting. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-600 flex items-center justify-center text-white text-xl">
          🤖
        </div>
        <div>
          <div className="font-bold text-gray-900">healthCopilot AI</div>
          <div className="text-xs text-gray-400">
            Aware of your conditions, goals, and today&apos;s plan
          </div>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Health Rules Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-sky-600 flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div
              className={cn(
                "max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white"
                  : "bg-white border border-gray-100 shadow-card text-gray-700"
              )}
            >
              {msg.content === "..." ? (
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  className="prose-sm"
                />
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 text-sm flex-shrink-0 mt-0.5">
                👤
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length < 3 && (
        <div className="px-6 py-3 bg-white border-t border-gray-100">
          <div className="text-xs text-gray-400 font-medium mb-2">Suggested questions:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-medium border border-violet-200 hover:bg-violet-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about your nutrition, exercise, or health plan..."
            className="flex-1 px-5 py-3.5 rounded-2xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm bg-gray-50 text-gray-900"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !userId}
            className={cn(
              "px-5 py-3.5 rounded-2xl font-bold text-sm transition-all",
              input.trim() && !loading && userId
                ? "bg-gradient-to-r from-violet-500 to-sky-600 text-white hover:opacity-90 shadow-glow-purple"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin block" />
            ) : "Send"}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Educational use only — not medical advice. Consult your healthcare provider for clinical decisions.
        </div>
      </div>
    </div>
  );
}
