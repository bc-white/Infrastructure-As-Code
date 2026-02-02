import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import {
  Loader2,
  Send,
  User,
  Bot,
  MessageCircle,
  ArrowLeft,
  ArrowUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { healthAssistantAPI, getCurrentUser } from '../service/api';

const CONVERSATION_STORAGE_KEY = 'askMocky365:conversations';

const formatMarkdownInline = (text) => {
  let formatted = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return formatted;
};

const renderMarkdown = (text) => {
  const lines = text.split(/\r?\n/);
  const html = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      html.push(`<ul>${listBuffer.join('')}</ul>`);
      listBuffer = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      html.push('<br />');
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      const item = trimmed.replace(/^-\s+/, '');
      listBuffer.push(`<li>${formatMarkdownInline(item)}</li>`);
      return;
    }

    flushList();
    if (/^#{1,6}\s+/.test(trimmed)) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = formatMarkdownInline(match[2]);
        html.push(`<h${level}>${content}</h${level}>`);
        return;
      }
    }

    html.push(`<p>${formatMarkdownInline(trimmed)}</p>`);
  });

  flushList();
  return html.join('');
};

const AskMocky365 = () => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [pendingEditId, setPendingEditId] = useState(null);
  const hasClearedOnceRef = useRef(false);
  const clearConfirmToastRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const containerTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
      const containerHeight = scrollContainerRef.current ? scrollContainerRef.current.scrollHeight : 0;
      const containerViewport = scrollContainerRef.current ? scrollContainerRef.current.clientHeight : 0;
      const windowTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowScrollTop(containerTop > 120 || windowTop > 120);
      const nearBottom = containerHeight - (containerTop + containerViewport) < 160;
      setShowScrollBottom(!nearBottom);
    };

    const containerEl = scrollContainerRef.current;
    containerEl?.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      containerEl?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;

      const hydrated = parsed
        .map((entry) => {
          const timestampValue = entry?.timestamp;
          const timestamp =
            timestampValue instanceof Date
              ? timestampValue
              : timestampValue
              ? new Date(timestampValue)
              : new Date();

          return {
            ...entry,
            timestamp,
          };
        })
        .filter((entry) => entry?.id && entry?.role && entry?.content);

      if (hydrated.length) {
        setConversations(hydrated);
      }
    } catch (error) {
     // console.error('Unable to restore AskMocky365 conversations from storage.', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!conversations.length) {
      window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      return;
    }

    try {
      const serialisable = conversations.map((entry) => ({
        ...entry,
        timestamp:
          entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp || new Date().toISOString(),
      }));

      window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(serialisable));
    } catch (error) {
      //console.error('Unable to persist AskMocky365 conversations to storage.', error);
    }
  }, [conversations]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations]);

  const parseAssistantResponse = (responsePayload) => {
    if (!responsePayload) return null;

    if (typeof responsePayload === 'string') {
      return responsePayload;
    }

    if (Array.isArray(responsePayload)) {
      return responsePayload
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
        .join('\n\n');
    }

    return (
      responsePayload.answer ||
      responsePayload.response ||
      responsePayload.content ||
      responsePayload.text ||
      (typeof responsePayload.message === 'string' ? responsePayload.message : null) ||
      JSON.stringify(responsePayload, null, 2)
    );
  };

  const handleAskQuestion = async (questionText = null) => {
    const finalQuestion = questionText || question;
    if (!finalQuestion.trim() || isLoading) return;

    let userMessage;

    if (pendingEditId) {
      setConversations((prev) => {
        const idx = prev.findIndex((msg) => msg.id === pendingEditId && msg.role === 'user');
        if (idx === -1) {
          return prev;
        }

        const updatedUserMessage = {
          ...prev[idx],
          content: finalQuestion.trim(),
          timestamp: new Date(),
        };

        const shouldRemoveAssistant = idx < prev.length - 1 && prev[idx + 1].role === 'assistant';
        const newList = [...prev];
        if (shouldRemoveAssistant) {
          newList.splice(idx + 1, 1);
        }
        newList[idx] = updatedUserMessage;
        userMessage = updatedUserMessage;
        return newList;
      });
    } else {
      userMessage = {
        id: Date.now(),
        role: 'user',
        content: finalQuestion.trim(),
        timestamp: new Date(),
      };

      setConversations((prev) => [...prev, userMessage]);
    }

    setQuestion('');
    setIsLoading(true);
    setPendingEditId(null);

    try {
      const payload = { question: finalQuestion.trim() };
      const response = await healthAssistantAPI.askMocky(payload);

      const resolvedContent =
        parseAssistantResponse(response?.data) ||
        response?.message ||
        'Mocky365 responded without additional details.';

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: resolvedContent,
        timestamp: new Date(),
      };

      setConversations((prev) => [...prev.filter((msg) => msg !== userMessage), userMessage, assistantMessage]);
    } catch (error) {
      const errorMessage = error?.message || 'Unable to contact Mocky365. Please try again.';
      toast.error(errorMessage);

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setConversations((prev) => [...prev.filter((msg) => msg !== userMessage), userMessage, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAskQuestion();
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const performClearChat = () => {
    setConversations([]);
    setQuestion('');
    setPendingEditId(null);
    hasClearedOnceRef.current = true;
  };

  const handleClearChat = () => {
    if (!hasClearedOnceRef.current) {
      performClearChat();
      return;
    }

    if (clearConfirmToastRef.current) {
      toast.dismiss(clearConfirmToastRef.current);
    }

    const toastId = toast.warning('Are you sure you want to clear the entire conversation?', {
      duration: 5000,
      description: 'This will remove the entire history for this session.',
      position: 'top-center',
      action: {
        label: 'Clear',
        onClick: () => {
          performClearChat();
          if (clearConfirmToastRef.current) {
            toast.dismiss(clearConfirmToastRef.current);
          }
          clearConfirmToastRef.current = null;
        },
      },
      onDismiss: () => {
        clearConfirmToastRef.current = null;
      },
    });

    clearConfirmToastRef.current = toastId;
  };

  const handleEditMessage = (messageId) => {
    const message = conversations.find((msg) => msg.id === messageId && msg.role === 'user');
    if (!message) return;

    setPendingEditId(messageId);
    setQuestion(message.content);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const currentUser = getCurrentUser();
  const greetingName = currentUser?.firstName || 'there';

  return (
    <div className="h-screen">
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200  text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:right-6 sm:top-6 bg-sky-800 text-white"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 pb-24 pt-28 sm:px-6">
        {conversations.length === 0 && !isLoading && (
          <header className="fixed left-1/2 top-0 z-10 w-full max-w-3xl -translate-x-1/2 border-b border-none bg-slate-50/95 px-4 py-6 text-center sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Mocky365</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Hello {greetingName}</h1>
            <p className="mt-2 text-base text-slate-500">How can I help you prepare today?</p>
          </header>
        )}

        <section className={`flex-1 ${conversations.length === 0 && !isLoading ? '' : 'pt-4'}`}>
          <div className="flex h-full flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-2 pt-6 pb-40 sm:px-3"
            >
              <div className="space-y-5">
                {conversations.length === 0 && !isLoading && (
                  <div className="rounded-xl bg-white/80 p-8 text-center">
                    <MessageCircle className="mx-auto mb-4 h-9 w-9 text-slate-300" />
                    <h2 className="text-base font-medium text-slate-800">
                      Start the conversation
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Ask about compliance readiness, life safety walkthroughs, corrective action plans, or survey timelines.
                    </p>
                  </div>
                )}

                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        conv.role === 'user'
                          ? 'bg-slate-900/90 text-white'
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        {conv.role === 'user' ? (
                          <>
                            <User className="h-3.5 w-3.5" />
                            <span>You</span>
                          </>
                        ) : (
                          <>
                            <Bot className="h-3.5 w-3.5" />
                            <span>Mocky365</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {conv.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {conv.role === 'user' && !isLoading && (
                          <button
                            type="button"
                            onClick={() => handleEditMessage(conv.id)}
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide transition ${
                              pendingEditId === conv.id
                                ? 'border border-white/60 bg-white/10 text-white'
                                : 'border border-white/30 text-white/80 hover:border-white/60 hover:text-white'
                            }`}
                          >
                            {pendingEditId === conv.id ? 'Editing…' : 'Edit & resend'}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 text-sm leading-relaxed">
                        {conv.role === 'assistant' ? (
                          <span
                            className="markdown-output"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(conv.content) }}
                          />
                        ) : (
                          <span className="whitespace-pre-wrap">{conv.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span>Mocky365 is thinking&hellip;</span>
                  </div>
                )}

                {conversations.length > 0 && (
                  <div className="pb-8 pt-4 text-center">
                    <Button
                      onClick={handleClearChat}
                      variant="ghost"
                      className="h-auto px-4 py-2 text-xs uppercase tracking-wide text-red-600 hover:bg-transparent hover:text-red-500 focus-visible:outline-none focus-visible:ring-0"
                    >
                      Clear chat now?
                    </Button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-end gap-3">
          <Textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something specific about your facility, survey prep, or compliance plan..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0"
          />
          <Button
            onClick={() => handleAskQuestion()}
            disabled={!question.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed right-4 bottom-24 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:right-6"
          aria-label="Scroll to top"
          style={{ cursor: 'pointer' }}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed right-4 bottom-12 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:right-6"
          aria-label="Scroll to bottom"
          style={{ cursor: 'pointer' }}
        >
          <ArrowUp className="h-5 w-5 rotate-180" />
        </button>
      )}
    </div>
  );
};

export default AskMocky365;