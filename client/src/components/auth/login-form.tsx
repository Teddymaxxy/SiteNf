import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

interface LoginFormProps {
  onError: (error: string) => void;
}

export function LoginForm({ onError }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    onError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Login successful:', result);
        login(result.user, result.token);
        // Force re-render by triggering auth check
        window.location.reload();
      } else {
        onError(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      onError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          className="mt-1"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('senha')}
          className="mt-1"
        />
        {errors.senha && (
          <p className="text-sm text-red-600 mt-1">{errors.senha.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <LogIn className="w-4 h-4 mr-2" />
        )}
        Entrar
      </Button>
    </form>
  );
}
