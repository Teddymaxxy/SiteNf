import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { OnlineUsers } from "@/components/chat/online-users";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, LogOut, Users, Wifi } from "lucide-react";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const token = localStorage.getItem('auth_token');
  const { isConnected, messages, onlineUsers, typingUsers, sendMessage, sendTyping, addEventListener } = useSocket(token);
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Handle socket errors (rate limiting, etc.)
  useEffect(() => {
    addEventListener('error', (data: { message: string; remainingTime?: number }) => {
      toast({
        title: "Sistema Anti-Spam",
        description: data.message,
        variant: "destructive",
        duration: 5000,
      });
      
      if (data.remainingTime) {
        setIsBlocked(true);
        setBlockTimeRemaining(data.remainingTime);
        
        // Countdown timer
        const interval = setInterval(() => {
          setBlockTimeRemaining(prev => {
            if (prev <= 1) {
              setIsBlocked(false);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });
  }, [addEventListener, toast]);

  const handleLogout = () => {
    logout();
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-medium text-gray-900">Chat Público</h1>
              <p className="text-xs text-gray-600">
                {onlineUsers.length} usuário{onlineUsers.length !== 1 ? 's' : ''} online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowMobileUsers(true)}
            >
              <Users className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">
                Conectado como <strong>{user.nome}</strong>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Connection Status */}
      {!isConnected && (
        <Alert variant="destructive" className="m-4">
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            Conexão perdida. Tentando reconectar...
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <main className="flex-1 flex flex-col relative">
          <div className="messages-area overflow-hidden">
            <MessageList 
              messages={messages} 
              currentUserId={user.id} 
              typingUsers={typingUsers}
            />
          </div>
          <div className="flex-shrink-0">
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={sendTyping}
              disabled={!isConnected || isBlocked}
              blockTimeRemaining={blockTimeRemaining}
            />
          </div>
        </main>

        {/* Desktop Sidebar */}
        <OnlineUsers 
          users={onlineUsers}
          typingUsers={typingUsers}
          className="hidden lg:block" 
        />
      </div>

      {/* Mobile Users Drawer */}
      {showMobileUsers && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowMobileUsers(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform">
            <OnlineUsers 
              users={onlineUsers}
              typingUsers={typingUsers}
              onClose={() => setShowMobileUsers(false)}
              mobile
            />
          </div>
        </div>
      )}
    </div>
  );
}
