import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string>('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Chat Público</h1>
            <p className="text-gray-600 text-sm">Conecte-se e converse em tempo real</p>
          </div>

          <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {activeTab === 'login' ? (
            <LoginForm onError={setError} />
          ) : (
            <RegisterForm onError={setError} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
