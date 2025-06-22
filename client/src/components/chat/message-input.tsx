import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  blockTimeRemaining?: number;
}

export function MessageInput({ onSendMessage, onTyping, disabled, blockTimeRemaining }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSendMessage(content.trim());
      setContent('');
      handleTypingStop();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 relative z-10 chat-input-fixed">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={blockTimeRemaining ? `Bloqueado por ${blockTimeRemaining}s - Anti-spam ativo` : "Digite sua mensagem... (máx. 500 caracteres)"}
            className={`resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-sm min-h-[40px] max-h-[120px] auto-resize-textarea ${
              disabled 
                ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-600 focus:border-transparent' 
                : 'border-gray-300 focus:ring-blue-600 focus:border-transparent'
            }`}
            maxLength={500}
            rows={1}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col items-end space-y-1">
          <Button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!content.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
          <span className={`text-xs ${disabled ? 'text-red-500' : 'text-gray-500'}`}>
            {blockTimeRemaining ? `Bloqueado: ${blockTimeRemaining}s` : `${content.length}/500`}
          </span>
        </div>
      </form>
    </div>
  );
}
