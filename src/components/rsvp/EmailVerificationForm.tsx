
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchGuestInfo } from '@/integrations/supabase/supabase-rsvp';
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
  const { user } = useAuth();

  // Email verification form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const checkExistingRsvp = async (guestId: string) => {
    try {
      console.log('=== DETAILED RSVP CHECK START ===');
      console.log('Checking for existing RSVP for guest ID:', guestId);
      
      // Try multiple queries to debug the issue
      console.log('Query 1: Basic select with guest_id filter');
      const { data: basicQuery, error: basicError } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('guest_id', guestId);
        
      console.log('Basic query result:', { data: basicQuery, error: basicError });
      
      console.log('Query 2: Count query to see if any records exist');
      const { count, error: countError } = await supabase
        .from('rsvp_responses')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', guestId);
        
      console.log('Count query result:', { count, error: countError });
      
      console.log('Query 3: All RSVPs for debugging (limited to 10)');
      const { data: allRsvps, error: allError } = await supabase
        .from('rsvp_responses')
        .select('id, guest_id, attending, created_at')
        .limit(10);
        
      console.log('All RSVPs sample:', { data: allRsvps, error: allError });
      
      // Main query with proper ordering
      console.log('Query 4: Main query with ordering');
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('id, attending, created_at')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error in main RSVP query:', error);
        return null;
      }
      
      console.log('Main query result:', data);
      console.log('Number of existing RSVPs found:', data?.length || 0);
      console.log('=== DETAILED RSVP CHECK END ===');
      
      if (data && data.length > 0) {
        console.log('Found existing RSVP:', data[0]);
        return data[0];
      }
      
      console.log('No existing RSVP found for guest ID:', guestId);
      return null;
    } catch (error) {
      console.error('Error checking existing RSVP:', error);
      return null;
    }
  };

  const handleVerify = async (values: EmailFormValues) => {
    setIsVerifying(true);
    
    try {
      console.log('Starting verification process for email:', values.email);
      
      // Use the centralized fetchGuestInfo function
      const guestInfo = await fetchGuestInfo(values.email);
      console.log('Guest info result:', guestInfo);
      
      if (guestInfo) {
        console.log('Guest found, checking for existing RSVP with guest ID:', guestInfo.id);
        
        // Check if this guest has already submitted an RSVP
        const existingRsvp = await checkExistingRsvp(guestInfo.id);
        
        if (existingRsvp) {
          console.log('Existing RSVP found:', existingRsvp);
          const attendingStatus = existingRsvp.attending ? 'attending' : 'not attending';
          const submissionDate = new Date(existingRsvp.created_at).toLocaleDateString();
          
          toast.success('Existing RSVP Found', {
            description: `You previously responded that you are ${attendingStatus} (${submissionDate}). You can update your response below.`,
            duration: 6000,
          });
          
          // Pass existing RSVP data to allow updates
          onEmailVerified(values.email, guestInfo, existingRsvp);
          return;
        } else {
          console.log('No existing RSVP found for this guest');
        }
        
        // If no existing RSVP, proceed with verification
        onEmailVerified(values.email, guestInfo);
        toast.success('Email verified', {
          description: 'Please proceed with your RSVP',
        });
      } else {
        console.error('Email not found in invited guests list');
        toast.error('Verification failed', {
          description: 'This email is not on the guest list. Please contact the hosts if you believe this is an error.',
        });
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
