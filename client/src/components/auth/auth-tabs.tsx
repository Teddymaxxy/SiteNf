import { Button } from "@/components/ui/button";

interface AuthTabsProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
}

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-200">
        <Button
          variant="ghost"
          className={`flex-1 py-2 px-4 text-center font-medium border-b-2 rounded-none ${
            activeTab === 'login'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-blue-600'
          }`}
          onClick={() => onTabChange('login')}
        >
          Login
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 py-2 px-4 text-center font-medium border-b-2 rounded-none ${
            activeTab === 'register'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-blue-600'
          }`}
          onClick={() => onTabChange('register')}
        >
          Cadastrar
        </Button>
      </div>
    </div>
  );
}
