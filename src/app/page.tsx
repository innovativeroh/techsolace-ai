'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Copy, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/theme-toggle';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import { useTheme } from 'next-themes';
import { Sparkles, Bot, User } from 'lucide-react';

const API_KEY = 'AIzaSyCRsqxgVftRWv55I6bqWLjoSmd27M5RBdw';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCode?: boolean;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code, language = 'javascript' }: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 mb-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
    >
      <div className="bg-zinc-100 dark:bg-zinc-800 p-2 flex justify-between items-center">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{language}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className={`hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className={`m-0 p-4 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </motion.div>
  );
};

const MessageAvatar = ({ role }: { role: 'user' | 'assistant' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`w-8 h-8 rounded-full flex items-center justify-center ${
        role === 'user' 
          ? 'bg-gradient-to-br from-purple-400 to-pink-500' 
          : 'bg-gradient-to-br from-blue-400 to-cyan-500'
      }`}
    >
      {role === 'user' ? (
        <User className={`w-5 h-5 ${isDark ? 'text-zinc-900' : 'text-white'}`} />
      ) : (
        <Bot className={`w-5 h-5 ${isDark ? 'text-zinc-900' : 'text-white'}`} />
      )}
    </motion.div>
  );
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      controls.start({
        opacity: [0, 1],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' }
      });
    } else {
      controls.stop();
    }
  }, [isLoading, controls]);

  const detectCodeBlock = (text: string): boolean => {
    return text.includes('\`\`\`') || 
           /^(const|let|var|function|import|class|if|for|while)\s/.test(text) ||
           /[\{\}]+/.test(text);
  };

  const getLanguageFromCodeFence = (text: string): string => {
    const match = text.match(/\`\`\`(\w+)/);
    return match ? match[1] : 'javascript';
  };

  const formatMessage = (content: string) => {
    if (!content.includes('\`\`\`')) {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    const parts = content.split(/(\`\`\`[\w]*\n[\s\S]*?\n\`\`\`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('\`\`\`')) {
        const language = getLanguageFromCodeFence(part);
        const code = part.replace(/\`\`\`[\w]*\n/, '').replace(/\n\`\`\`$/, '');
        return <CodeBlock key={index} code={code} language={language} />;
      }
      return <p key={index} className="whitespace-pre-wrap">{part}</p>;
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      
      const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: new Date(),
        isCode: detectCodeBlock(input)
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: input
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          isCode: detectCodeBlock(responseText)
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-4"
      >
        <h1 className="font-bold text-2xl text-primary flex items-center gap-2">
          Techsolace AI Chat <Sparkles className="w-5 h-5 text-yellow-400" />
        </h1>
        <ThemeToggle />
      </motion.div>
      <Card className="flex-1 flex flex-col overflow-hidden backdrop-blur-sm bg-opacity-50 border border-zinc-200 dark:border-zinc-700">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <MessageAvatar role={message.role} />
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      <div>
                        {formatMessage(message.content)}
                      </div>
                      <p className="text-xs mt-1 opacity-70">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                animate={controls}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </ScrollArea>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 border-t border-border"
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-opacity-50 backdrop-blur-sm"
            />
            <Button 
              type="submit"
              disabled={isLoading}
              className="px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </motion.div>
      </Card>
    </div>
  );
}

