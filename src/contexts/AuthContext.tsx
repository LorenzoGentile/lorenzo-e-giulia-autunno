
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isInvitedGuest: boolean;
  checkInvitedStatus: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvitedGuest, setIsInvitedGuest] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
            
            // If session exists, check if user is invited
            if (session?.user) {
              setTimeout(() => {
                checkInvitedStatus(session.user.email || '');
              }, 0);
            } else {
              setIsInvitedGuest(false);
            }
          }
        );
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is invited
        if (session?.user?.email) {
          const isInvited = await checkInvitedStatus(session.user.email);
          setIsInvitedGuest(isInvited);
        }
        
        setIsLoading(false);
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error setting up auth:', error);
        setIsLoading(false);
      }
    };
    
    setupAuth();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      // First check if the email is in the invited_guests table
      const isInvited = await checkInvitedStatus(email);
      
      if (!isInvited) {
        toast.error('Login failed', {
          description: 'This email is not on our guest list. Please contact the hosts if this is an error.'
        });
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast.error('Login failed', {
        description: error.message || 'Unable to log in'
      });
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error('Sign out failed', { 
        description: error.message || 'Unable to sign out'
      });
      throw error;
    }
  };
  
  const checkInvitedStatus = async (email: string): Promise<boolean> => {
    try {
      console.log('Checking invited status for email:', email);
      
      if (!email) {
        console.log('No email provided to check');
        return false;
      }
      
      // Normalize email to lowercase for consistent comparison
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Making query to invited_guests table for email: ${normalizedEmail}`);
      
      // Use exact match for better performance
      const { data, error } = await supabase
        .from('invited_guests')
        .select('id, email')
        .eq('email', normalizedEmail)
        .limit(1);
        
      if (error) {
        console.error('Error checking invited status:', error);
        // Try with case-insensitive search as fallback
        const fallbackResult = await supabase
          .from('invited_guests')
          .select('id, email')
          .ilike('email', normalizedEmail)
          .limit(1);
          
        if (fallbackResult.error) {
          console.error('Fallback search also failed:', fallbackResult.error);
          return false;
        }
        
        console.log('Fallback invited guests query result:', fallbackResult.data);
        const isInvited = Boolean(fallbackResult.data && fallbackResult.data.length > 0);
        console.log('Is invited (fallback):', isInvited);
        setIsInvitedGuest(isInvited);
        return isInvited;
      }
      
      console.log('Invited guests query result:', data);
      
      // Check if data array has any items
      const isInvited = Boolean(data && data.length > 0);
      console.log('Is invited:', isInvited);
      
      setIsInvitedGuest(isInvited);
      return isInvited;
    } catch (error) {
      console.error('Error checking invited status:', error);
      return false;
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signOut,
    isInvitedGuest,
    checkInvitedStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
