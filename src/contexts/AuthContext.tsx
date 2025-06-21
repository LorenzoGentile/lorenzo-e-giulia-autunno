
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

  const checkInvitedStatus = React.useCallback(async (email: string): Promise<boolean> => {
    try {
      console.log('Checking invited status for email:', email);
      
      if (!email) {
        console.log('No email provided to check');
        return false;
      }
      
      console.log(`Making query to invited_guests table for email: ${email}`);
      
      const { data, error, count } = await supabase
        .from('invited_guests')
        .select('*', { count: 'exact' })
        .eq('email', email.toLowerCase());
        
      if (error) {
        console.error('Error checking invited status:', error);
        return false;
      }
      
      console.log('Invited guests query result:', data);
      console.log('Count:', count);
      
      const isInvited = Boolean(data && data.length > 0);
      console.log('Is invited:', isInvited);
      
      setIsInvitedGuest(isInvited);
      return isInvited;
    } catch (error) {
      console.error('Error checking invited status:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const setupAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state change:', event, session?.user?.email);
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Handle sign out event specifically
            if (event === 'SIGNED_OUT') {
              console.log('User signed out, clearing state');
              setIsInvitedGuest(false);
              setSession(null);
              setUser(null);
            }
            
            // If session exists, check if user is invited
            if (session?.user?.email) {
              try {
                await checkInvitedStatus(session.user.email);
              } catch (error) {
                console.error('Error checking invited status:', error);
                setIsInvitedGuest(false);
              }
            } else {
              setIsInvitedGuest(false);
            }
            
            if (mounted) {
              setIsLoading(false);
            }
          }
        );
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user is invited
        if (session?.user?.email) {
          try {
            await checkInvitedStatus(session.user.email);
          } catch (error) {
            console.error('Error checking invited status:', error);
            setIsInvitedGuest(false);
          }
        }
        
        setIsLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
    };
  }, [checkInvitedStatus]);
  
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
      console.log('Attempting to sign out...');
      
      // Clear local state immediately
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      
      // Clear all auth-related state
      setSession(null);
      setUser(null);
      setIsInvitedGuest(false);
      setIsLoading(false);
      
      toast.success('Logout successful');
      
    } catch (error: any) {
      console.error('Sign out failed:', error);
      setIsLoading(false);
      toast.error('Sign out failed', { 
        description: error.message || 'Unable to sign out'
      });
      throw error;
    }
  };

  const value = React.useMemo(() => ({
    session,
    user,
    isLoading,
    signIn,
    signOut,
    isInvitedGuest,
    checkInvitedStatus
  }), [session, user, isLoading, isInvitedGuest, checkInvitedStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
