import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface RegisterFormProps {
  onError: (error: string) => void;
}

export function RegisterForm({ onError }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    onError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Registration successful:', result);
        login(result.user, result.token);
        // Force re-render by triggering auth check
        window.location.reload();
      } else {
        onError(result.message || 'Erro ao criar conta');
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
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Seu nome completo"
          {...register('nome')}
          className="mt-1"
        />
        {errors.nome && (
          <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
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
        <Label htmlFor="register-password">Senha</Label>
        <Input
          id="register-password"
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
        className="w-full bg-green-600 hover:bg-green-700" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )}
        Criar Conta
      </Button>
    </form>
  );
}
