
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface EmailVerificationFormProps {
  onEmailVerified: (email: string, guestInfo: { id: string; name: string }, existingRsvp?: { id: string; attending: boolean; created_at: string }) => void;
}

const EmailVerificationForm = ({ onEmailVerified }: EmailVerificationFormProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, isInvitedGuest, checkInvitedStatus } = useAuth();

  // Email verification form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const fetchGuestInfo = async (email: string) => {
    try {
      console.log('Fetching guest info for email:', email.toLowerCase());
      
      // Use ilike for case-insensitive comparison and handle potential multiple matches
      const { data, error } = await supabase
        .from('invited_guests')
        .select('id, name, email')
        .ilike('email', email.toLowerCase())
        .limit(1);
        
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Raw database response:', data);
      
      if (data && data.length > 0) {
        return data[0]; // Return the first matching record
      }
      return null;
    } catch (error) {
      console.error('Error fetching guest info:', error);
      return null;
    }
  };

  const checkExistingRsvp = async (guestId: string) => {
    try {
      console.log('Checking for existing RSVP for guest ID:', guestId);
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('id, attending, created_at')
        .eq('guest_id', guestId)
        .limit(1);
        
      if (error) {
        console.error('Error checking existing RSVP:', error);
        return null;
      }
      
      console.log('Existing RSVP check result:', data);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking existing RSVP:', error);
      return null;
    }
  };

  const handleVerify = async (values: EmailFormValues) => {
    setIsVerifying(true);
    
    try {
      console.log('Starting verification process for email:', values.email);
      
      // First, try to fetch guest info directly
      console.log('Fetching guest info directly from database...');
      const guestInfo = await fetchGuestInfo(values.email);
      console.log('Direct guest info result:', guestInfo);
      
      if (guestInfo) {
        // Check if this guest has already submitted an RSVP
        const existingRsvp = await checkExistingRsvp(guestInfo.id);
        
        if (existingRsvp) {
          const attendingStatus = existingRsvp.attending ? 'attending' : 'not attending';
          const submissionDate = new Date(existingRsvp.created_at).toLocaleDateString();
          
          toast.success('Existing RSVP Found', {
            description: `You previously responded that you are ${attendingStatus} (${submissionDate}). You can update your response below.`,
            duration: 6000,
          });
          
          // Pass existing RSVP data to allow updates
          onEmailVerified(values.email, guestInfo, existingRsvp);
          return;
        }
        
        // If no existing RSVP, proceed with verification
        onEmailVerified(values.email, guestInfo);
        toast.success('Email verified', {
          description: 'Please proceed with your RSVP',
        });
      } else {
        // Fallback: check with AuthContext method
        console.log('Direct fetch failed, trying AuthContext method...');
        const isInvited = await checkInvitedStatus(values.email);
        console.log('AuthContext invited status check result:', isInvited);
        
        if (isInvited) {
          // Try fetching guest info again after auth check
          const secondAttemptGuestInfo = await fetchGuestInfo(values.email);
          if (secondAttemptGuestInfo) {
            const existingRsvp = await checkExistingRsvp(secondAttemptGuestInfo.id);
            
            if (existingRsvp) {
              const attendingStatus = existingRsvp.attending ? 'attending' : 'not attending';
              const submissionDate = new Date(existingRsvp.created_at).toLocaleDateString();
              
              toast.success('Existing RSVP Found', {
                description: `You previously responded that you are ${attendingStatus} (${submissionDate}). You can update your response below.`,
                duration: 6000,
              });
              
              onEmailVerified(values.email, secondAttemptGuestInfo, existingRsvp);
              return;
            }
            
            onEmailVerified(values.email, secondAttemptGuestInfo);
            toast.success('Email verified', {
              description: 'Please proceed with your RSVP',
            });
          } else {
            console.error('Guest info fetch returned null after auth check');
            toast.error('Error retrieving guest information', {
              description: 'Please try again or contact the hosts.',
            });
          }
        } else {
          console.error('Email not found in invited guests list');
          toast.error('Verification failed', {
            description: 'This email is not on the guest list. Please contact the hosts if you believe this is an error.',
          });
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification error', {
        description: 'An error occurred during verification. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto autumn-card">
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(handleVerify)} className="space-y-6">
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email*</FormLabel>
                <FormControl>
                  <Input {...field} type="email" required />
                </FormControl>
                <FormDescription>
                  Inserisci l'email a cui hai ricevuto l'invito
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-center">
            <Button 
              type="submit" 
              className="autumn-button"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifica in corso...' : 'Verifica Email'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EmailVerificationForm;
