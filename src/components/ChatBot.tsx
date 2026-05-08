import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTIONS = [
  'How do I attempt a quiz?',
  'Explain Big-O in 30 seconds',
  'Where do I find my certificates?',
  'Tips to score above 90%',
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || 'Something went wrong');
    return;
  }

  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let assistantText = '';
    const upsert = (chunk: string) => {
      assistantText += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: 'assistant', content: assistantText }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setLoading(false),
        onError: (msg) => {
          upsert(`⚠️ ${msg}`);
          setLoading(false);
        },
      });
    } catch {
      upsert('⚠️ Failed to connect to assistant.');
      setLoading(false);
    }
  };

  const copyMessage = async (idx: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // ignore
    }
  };

  const reset = () => {
    if (loading) return;
    setMessages([]);
  };

  return (
    <>
      {/* Floating Action Button — Candy Cosmos */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full',
          'bg-gradient-to-br from-[#7C3AED] via-[#FF006E] to-[#FB923C]',
          'text-white shadow-[0_12px_40px_-8px_rgba(255,0,110,0.55)]',
          'transition-all duration-300 hover:scale-110 active:scale-95',
          open && 'rotate-90',
        )}
        aria-label="Toggle chat"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A3E635] opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-[#A3E635] ring-2 ring-white" />
            </span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className={cn(
            'fixed bottom-24 right-4 z-50 flex h-[600px] w-[calc(100vw-2rem)] max-w-[420px] flex-col',
            'overflow-hidden rounded-3xl border border-white/40 dark:border-white/10',
            'bg-white/85 dark:bg-[#1A0B2E]/90 backdrop-blur-xl',
            'shadow-[0_30px_80px_-20px_rgba(124,58,237,0.45)]',
            'animate-in slide-in-from-bottom-4 fade-in duration-300',
          )}
        >
          {/* Aurora background blobs */}
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-[#FF006E]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-[#7C3AED]/30 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#06B6D4]/20 blur-3xl" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-gradient-to-r from-[#7C3AED] via-[#FF006E] to-[#FB923C] px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/40">
                <Sparkles className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#A3E635] ring-2 ring-white" />
              </div>
              <div className="leading-tight">
                <p className="font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Cosmo
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  SUKCSD · Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="New chat"
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="relative z-10 flex-1 px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center mt-6 px-2">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#FF006E] shadow-lg shadow-[#FF006E]/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Hi, I'm Cosmo ✨
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your study buddy for the SUKCSD portal. Ask me anything!
                </p>
                <div className="mt-5 grid w-full grid-cols-1 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="group rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-left text-sm transition-all hover:border-[#FF006E]/50 hover:bg-white/90 hover:shadow-md hover:shadow-[#FF006E]/10"
                    >
                      <span className="mr-2 text-[#FF006E]">›</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'mb-4 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
                  m.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {m.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#FF006E] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={cn('flex max-w-[82%] flex-col gap-1', m.role === 'user' && 'items-end')}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      m.role === 'user'
                        ? 'rounded-br-md bg-gradient-to-br from-[#7C3AED] to-[#FF006E] text-white'
                        : 'rounded-bl-md border border-white/50 dark:border-white/10 bg-white/90 dark:bg-white/5 text-foreground backdrop-blur-sm',
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <div
                        className={cn(
                          'prose prose-sm max-w-none dark:prose-invert',
                          'prose-p:my-1.5 prose-p:leading-relaxed',
                          'prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-bold',
                          'prose-h3:text-[15px] prose-h3:text-[#7C3AED] dark:prose-h3:text-[#A78BFA]',
                          'prose-strong:text-[#1A0B2E] dark:prose-strong:text-white',
                          'prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
                          'prose-code:rounded prose-code:bg-[#FF006E]/10 prose-code:px-1.5 prose-code:py-0.5',
                          'prose-code:text-[#FF006E] prose-code:font-mono prose-code:text-[12.5px]',
                          'prose-code:before:content-none prose-code:after:content-none',
                          'prose-pre:my-2 prose-pre:rounded-xl prose-pre:bg-[#1A0B2E] prose-pre:text-[#E5DCF5]',
                          'prose-pre:p-3 prose-pre:text-[12px]',
                          'prose-blockquote:border-l-4 prose-blockquote:border-[#FF006E]',
                          'prose-blockquote:bg-[#FF006E]/5 prose-blockquote:py-1 prose-blockquote:px-3',
                          'prose-blockquote:rounded-r-lg prose-blockquote:not-italic',
                          'prose-blockquote:text-foreground',
                          'prose-a:text-[#7C3AED] prose-a:no-underline hover:prose-a:underline',
                          'prose-table:text-[12.5px] prose-th:bg-[#7C3AED]/10 prose-th:p-1.5',
                          'prose-td:p-1.5 prose-td:border-[#E5DCF5]',
                          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
                        )}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content || '…'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    )}
                  </div>
                  {m.role === 'assistant' && m.content && (
                    <button
                      onClick={() => copyMessage(i, m.content)}
                      className="flex items-center gap-1 px-1 text-[10px] uppercase tracking-wider text-muted-foreground transition hover:text-[#FF006E]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {copiedIdx === i ? (
                        <><Check className="h-3 w-3" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="mb-4 flex gap-2">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#FF006E]">
                  <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/50 dark:border-white/10 bg-white/90 dark:bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#FF006E] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#FB923C] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="relative z-10 border-t border-white/30 dark:border-white/10 bg-white/60 dark:bg-[#1A0B2E]/60 backdrop-blur-md p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/50 dark:border-white/10 bg-white dark:bg-white/5 p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#FF006E]/40 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask Cosmo anything…"
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className={cn(
                  'h-9 w-9 shrink-0 rounded-xl shadow-md transition-all',
                  'bg-gradient-to-br from-[#7C3AED] to-[#FF006E] text-white',
                  'hover:shadow-lg hover:shadow-[#FF006E]/30 hover:scale-105',
                  'disabled:opacity-40 disabled:hover:scale-100',
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ⏎ to send · ⇧⏎ for new line
            </p>
          </form>
        </div>
      )}
    </>
  );
}
