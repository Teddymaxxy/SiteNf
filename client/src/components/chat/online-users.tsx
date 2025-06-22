import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnlineUsersProps {
  users: Array<{
    id: number;
    nome: string;
    email: string;
  }>;
  typingUsers: Set<string>;
  className?: string;
  mobile?: boolean;
  onClose?: () => void;
}

export function OnlineUsers({ users, typingUsers, className = '', mobile = false, onClose }: OnlineUsersProps) {
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

  return (
    <aside className={`w-64 bg-white border-l border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Usuários Online
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {users.length}
            </span>
          </h2>
          {mobile && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-8 h-8 ${getAvatarColor(user.id)} text-white rounded-full flex items-center justify-center text-sm font-medium`}>
                  {getInitial(user.nome)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.nome}
                </p>
                <div className="flex items-center space-x-1">
                  <p className="text-xs text-gray-500">
                    {typingUsers.has(user.nome) ? 'Digitando' : 'Online'}
                  </p>
                  {typingUsers.has(user.nome) && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full typing-dot"></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full typing-dot"></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full typing-dot"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum usuário online
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
