
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  const { checkInvitedStatus } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if the email is invited
      const isInvited = await checkInvitedStatus(email);
      
      if (!isInvited) {
        toast.error('Login failed', {
          description: 'This email is not on our guest list. Please contact the hosts if this is an error.'
        });
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Login successful', {
        description: 'Welcome back!'
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials and try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Email required', {
        description: 'Please enter your email address'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent', {
        description: 'Check your inbox for instructions'
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Failed to send reset email', {
        description: error.message || 'Please try again later'
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
