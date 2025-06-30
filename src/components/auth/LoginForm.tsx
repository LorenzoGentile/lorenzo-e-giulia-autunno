
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSuccess: () => void;
}

const LoginForm = ({ email, setEmail, password, setPassword, onSuccess }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Campi richiesti', {
        description: 'Inserisci email e password'
      });
      return;
    }
    
    setIsLoading(true);

    try {
      await signIn(email, password);
      onSuccess();
    } catch (error: any) {
      // Error handling is done in the signIn method
      console.error('Login form error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Email richiesta', {
        description: 'Inserisci la tua email per recuperare la password'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        console.error('Reset password error:', error);
        
        if (error.message?.includes('Failed to fetch')) {
          toast.error('Errore di connessione', {
            description: 'Impossibile inviare l\'email di reset. Controlla la connessione.'
          });
        } else {
          toast.error('Errore invio email', {
            description: error.message || 'Riprova più tardi'
          });
        }
      } else {
        toast.success('Email inviata', {
          description: 'Controlla la tua casella di posta per le istruzioni'
        });
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Errore invio email', {
        description: 'Riprova più tardi'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="La tua email"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="La tua password"
          disabled={isLoading}
        />
      </div>
      
      <Button
        type="submit"
        className="w-full autumn-button"
        disabled={isLoading}
      >
        {isLoading ? 'Accesso in corso...' : 'Accedi'}
      </Button>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResetPassword}
          className="text-sm text-autumn-terracotta hover:underline"
          disabled={isLoading}
        >
          Password dimenticata?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
