import { useEffect, useRef, useState } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/bottom-nav";

interface ChatScreenProps {
  accessToken: string;
  firstName: string;
}

interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function ChatScreen({ accessToken, firstName }: ChatScreenProps) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMessages, setLocalMessages] = useState<StreamMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: history } = useGetChatHistory(
    { access_token: accessToken },
    { query: { queryKey: getGetChatHistoryQueryKey({ access_token: accessToken }) } }
  );

  useEffect(() => {
    if (history) {
      setLocalMessages(
        history.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          created_at: m.created_at,
        }))
      );
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, streamingContent]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: StreamMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/chat/message?access_token=${encodeURIComponent(accessToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as { delta?: string; done?: boolean; error?: string };
              if (data.delta) {
                accumulated += data.delta;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                const assistantMsg: StreamMessage = {
                  id: `assistant-${Date.now()}`,
                  role: "assistant",
                  content: accumulated,
                  created_at: new Date().toISOString(),
                };
                setLocalMessages((prev) => [...prev, assistantMsg]);
                setStreamingContent("");
                queryClient.invalidateQueries({
                  queryKey: getGetChatHistoryQueryKey({ access_token: accessToken }),
                });
              }
            } catch { }
          }
        }
      }
    } catch {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "something went wrong. try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setStreaming(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  };

  const allMessages = [...localMessages];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-12 pb-40 max-w-2xl mx-auto w-full space-y-6">
        <div className="animate-in fade-in duration-700">
          <h1 className="text-3xl font-light italic tracking-tight text-primary">chat with flo.</h1>
          <p className="mt-1 text-xs text-muted-foreground tracking-wide">
            ask anything about your day
          </p>
        </div>

        {allMessages.length === 0 && !streaming && (
          <div className="flex flex-col gap-2 pt-8">
            {[
              `what's on my calendar today?`,
              `how should i prioritise my day?`,
              `what's the weather like?`,
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border-b border-border/10"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent/10 border border-accent/20 text-foreground"
                  : "text-foreground/90"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-xs text-muted-foreground tracking-widest uppercase block mb-2">flo.</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] text-sm leading-relaxed text-foreground/90">
              <span className="text-xs text-muted-foreground tracking-widest uppercase block mb-2">flo.</span>
              {streamingContent || (
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/10 px-4 md:px-8 py-3 z-40">
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="ask flo. anything..."
            disabled={streaming}
            className="flex-1 bg-transparent border-b border-border/30 focus:border-accent/50 outline-none text-sm text-foreground placeholder:text-muted-foreground/40 py-2 transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors tracking-wide"
          >
            send
          </button>
        </div>
      </div>

      <BottomNav accessToken={accessToken} />
    </div>
  );
}
