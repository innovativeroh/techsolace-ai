"use client"
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/theme-toggle';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_TOKEN = process.env.NEXT_PUBLIC_ASTRA_TOKEN;

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);
    if (!API_TOKEN) {
      setError('API token not configured');
      return;
    }
    setError(null);

    try {
      const res = await fetch('/api/getdata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          message: input,
          input_type: 'chat',
          output_type: 'chat',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.outputs[0].outputs[0].results.message.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    await handleSubmit();
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-2xl text-primary">AI Chat</h1>
        <ThemeToggle />
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-md">
                    <div
                      className={
                        message.role === 'user'
                          ? 'bg-blue-500 text-white p-3 rounded-lg'
                          : 'bg-gray-200 text-black p-3 rounded-lg'
                      }
                    >
                      {message.content}
                    </div>
                    <p className="text-xs mt-1 text-gray-500">{formatTimestamp(message.timestamp)}</p>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </CardContent>
        </ScrollArea>
        <div className="p-4 border-t">
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
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;