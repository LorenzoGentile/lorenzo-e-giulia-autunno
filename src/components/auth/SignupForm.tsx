
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SignupFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

const SignupForm = ({ email, setEmail, password, setPassword }: SignupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Check if an email exists in the invited_guests table
  const checkEmailInvited = async (email: string): Promise<boolean> => {
    try {
      console.log('Checking if email is invited:', email);
      
      if (!email) {
        console.log('No email provided to check');
        return false;
      }
      
      const { data, error } = await supabase
        .from('invited_guests')
        .select('*')
        .eq('email', email.toLowerCase());
        
      if (error) {
        console.error('Error checking invited status:', error);
        return false;
      }
      
      console.log('Invited check result:', data);
      
      // Check if data array has any items
      return Boolean(data && data.length > 0);
    } catch (error) {
      console.error('Error checking invited status:', error);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check if email is in the invited_guests table
      const isInvited = await checkEmailInvited(email);
      console.log('Is invited (sign up):', isInvited);
        
      if (!isInvited) {
        throw new Error('This email is not on our guest list. Please contact the hosts if this is an error.');
      }
      
      // Proceed with sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Registrazione completata!', {
        description: 'Ti abbiamo inviato un\'email di verifica. Per favore controlla la tua casella di posta.'
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Registrazione fallita', {
        description: error.message || 'Si è verificato un errore durante la registrazione'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="L'email del tuo invito"
        />
      </div>
      
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Crea una password"
        />
      </div>
      
      <Button
        type="submit"
        className="w-full autumn-button"
        disabled={isLoading}
      >
        {isLoading ? 'Registrazione in corso...' : 'Registrati'}
      </Button>
    </form>
  );
};

export default SignupForm;
