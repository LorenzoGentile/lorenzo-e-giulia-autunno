
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
        console.log('Setting up auth...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            // Update session and user state
            setSession(session);
            setUser(session?.user ?? null);
            
            // Handle invited status check
            if (session?.user?.email) {
              // Use setTimeout to avoid blocking the auth state change
              setTimeout(async () => {
                try {
                  const isInvited = await checkInvitedStatus(session.user.email!);
                  setIsInvitedGuest(isInvited);
                } catch (error) {
                  console.error('Error checking invited status in auth state change:', error);
                  setIsInvitedGuest(false);
                }
              }, 0);
            } else {
              setIsInvitedGuest(false);
            }
          }
        );
        
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session check:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Check if user is invited for initial session
          if (session?.user?.email) {
            try {
              const isInvited = await checkInvitedStatus(session.user.email);
              setIsInvitedGuest(isInvited);
            } catch (error) {
              console.error('Error checking initial invited status:', error);
              setIsInvitedGuest(false);
            }
          }
        }
        
        setIsLoading(false);
        
        return () => {
          console.log('Cleaning up auth subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
        setIsLoading(false);
      }
    };
    
    setupAuth();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      // First check if the email is in the invited_guests table
      const isInvited = await checkInvitedStatus(email);
      
      if (!isInvited) {
        toast.error('Accesso negato', {
          description: 'Questa email non è nella nostra lista invitati. Contatta gli sposi se pensi sia un errore.'
        });
        throw new Error('Email not invited');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.user?.email);
      
      toast.success('Accesso effettuato', {
        description: 'Benvenuto!'
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle network errors specifically
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        toast.error('Errore di connessione', {
          description: 'Impossibile connettersi al server. Controlla la tua connessione internet.'
        });
      } else if (error.message !== 'Email not invited') {
        toast.error('Errore di accesso', {
          description: error.message || 'Impossibile effettuare l\'accesso'
        });
      }
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      console.log('Attempting sign out...');
      
      // Clear local state immediately for better UX
      setSession(null);
      setUser(null);
      setIsInvitedGuest(false);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't throw here - we've already cleared local state
        // Just log the error and show a warning
        if (!error.message?.includes('Failed to fetch')) {
          toast.error('Errore durante il logout', { 
            description: 'Il logout locale è avvenuto con successo, ma si è verificato un errore con il server.'
          });
        }
      } else {
        console.log('Sign out successful');
        toast.success('Logout effettuato', {
          description: 'Arrivederci!'
        });
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Even if there's an error, we've cleared local state
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        toast.success('Logout effettuato', {
          description: 'Disconnesso localmente (problema di connessione)'
        });
      } else {
        toast.error('Errore durante il logout', { 
          description: 'Il logout locale è avvenuto comunque'
        });
      }
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
        
        // Handle network errors gracefully
        if (error.message?.includes('Failed to fetch') || error.details?.includes('Failed to fetch')) {
          console.log('Network error when checking invited status, defaulting to false');
          return false;
        }
        
        // Try with case-insensitive search as fallback
        try {
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
          return isInvited;
        } catch (fallbackError) {
          console.error('Fallback search failed completely:', fallbackError);
          return false;
        }
      }
      
      console.log('Invited guests query result:', data);
      
      // Check if data array has any items
      const isInvited = Boolean(data && data.length > 0);
      console.log('Is invited:', isInvited);
      
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
