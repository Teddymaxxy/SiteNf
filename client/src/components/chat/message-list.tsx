import { useEffect, useRef } from "react";
import { MessageWithUser } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageListProps {
  messages: MessageWithUser[];
  currentUserId: number;
  typingUsers: Set<string>;
}

export function MessageList({ messages, currentUserId, typingUsers }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-indigo-500', 'bg-teal-500'
    ];
    return colors[userId % colors.length];
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 messages-scroll bg-gray-50">
      {messages.map((message) => {
        const isOwnMessage = message.usuarioId === currentUserId;
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              isOwnMessage 
                ? 'bg-blue-600 text-white rounded-lg px-4 py-2' 
                : 'bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
            }`}>
              <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                {message.conteudo}
              </p>
              <div className={`flex items-center justify-between mt-1 text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span className="font-medium">
                  {isOwnMessage ? 'Você' : message.usuario.nome}
                </span>
                <span>{formatTime(message.criadoEm?.toString() || '')}</span>
              </div>
            </div>
          </div>
        );
      })}



      <div ref={messagesEndRef} />
    </div>
  );
}
