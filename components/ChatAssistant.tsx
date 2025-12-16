import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { Language, Complaint } from '../types';
import { getTranslation } from '../translations';

interface ChatAssistantProps {
  language: Language;
  complaints: Complaint[];
  onAddComplaint: (location: string, description: string, imageUrl?: string, isPublic?: boolean) => void;
}

interface Message {
  id: number;
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ language, complaints, onAddComplaint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'model', text: `Hi! I'm ZeroBot. I can help you check your reports or file a new one.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      // Refresh welcome message on language change, or keep history? keeping history is better UX usually.
      // But we can add a system note or just let the bot adapt.
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleToolCall = async (name: string, args: any): Promise<string> => {
      if (name === 'create_complaint') {
          onAddComplaint(args.location, args.description, undefined, true);
          return `Complaint successfully created for ${args.location}.`;
      }
      return "Unknown action.";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Convert internal message format to API history format
      const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));

      const responseText = await getChatResponse(
          history, 
          userMessage.text, 
          language, 
          complaints,
          handleToolCall
      );
      
      const botMessage: Message = { id: Date.now() + 1, role: 'model', text: responseText };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { id: Date.now(), role: 'model', text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center justify-center"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-green-600 p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-bold">ZeroKachra AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-green-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-2 flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getTranslation(language, 'chatPlaceholder')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="ml-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;