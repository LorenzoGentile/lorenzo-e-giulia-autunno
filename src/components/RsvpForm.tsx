import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import EmailVerificationForm from './rsvp/EmailVerificationForm';
import RsvpFormFields from './rsvp/RsvpFormFields';
import { fetchGuestInfo, GuestInfo, submitRsvpResponse } from '@/integrations/supabase/supabase-rsvp';
import { RsvpFormValues } from '@/types/rsvp';
import { supabase } from '@/integrations/supabase/client';
interface AdditionalGuest {
  id: string;
  rsvp_id: string;
  name: string;
  dietary_restrictions?: string;
}
interface ExistingRsvp {
  id: string;
  attending: boolean;
  created_at: string;
  dietary_restrictions?: string;
  message?: string;
  additional_guests?: AdditionalGuest[]; // <-- add this!
}

const RsvpForm = () => {
  const { user, isInvitedGuest } = useAuth();
  const [step, setStep] = useState<'email' | 'rsvp'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<ExistingRsvp | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user is already verified as an invited guest
  useEffect(() => {
    const checkUserAndInitialize = async () => {
      if (user?.email && isInvitedGuest) {
        const info = await fetchGuestInfo(user.email);
        if (info) {
          setGuestInfo(info);
          setVerifiedEmail(user.email);
          setStep('rsvp');
        }
      }
    };
    
    checkUserAndInitialize();
  }, [user, isInvitedGuest]);

  const fetchExistingRsvpDetails = async (rsvpId: string) => {
    try {
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('*, additional_guests(*)')
        .eq('id', rsvpId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching existing RSVP details:', error);
      return null;
    }
  };

  const handleEmailVerified = async (email: string, info: GuestInfo, existingRsvpData?: { id: string; attending: boolean; created_at: string }) => {
    setVerifiedEmail(email);
    setGuestInfo(info);
    
    if (existingRsvpData) {
      // Fetch full RSVP details including additional guests
      const fullRsvpData = await fetchExistingRsvpDetails(existingRsvpData.id);
      if (fullRsvpData) {
        setExistingRsvp(fullRsvpData);
      }
    }
    
    setStep('rsvp');
  };
  
  const handleRsvpSubmitted = () => {
    // Reset form state if not logged in
    if (!user) {
      setStep('email');
      setVerifiedEmail('');
      setGuestInfo(null);
      setExistingRsvp(null);
    } else {
      toast.success('Thank you for your RSVP!');
    }
  };

  const updateExistingRsvp = async (rsvpId: string, formData: RsvpFormValues) => {
    try {
      // Update the main RSVP response
      const { error: rsvpError } = await supabase
        .from('rsvp_responses')
        .update({
          attending: formData.attending === 'yes',
          dietary_restrictions: formData.dietaryRestrictions,
          message: formData.songRequest,
          updated_at: new Date().toISOString()
        })
        .eq('id', rsvpId);
      
      if (rsvpError) throw rsvpError;
      
      // Delete existing additional guests
      const { error: deleteError } = await supabase
        .from('additional_guests')
        .delete()
        .eq('rsvp_id', rsvpId);
      
      if (deleteError) throw deleteError;
      
      // Insert new additional guests if attending and there are any
      if (formData.attending === 'yes' && formData.additionalGuests.length > 0) {
        const additionalGuestsToInsert = formData.additionalGuests
          .filter(guest => guest.name.trim() !== '')
          .map(guest => ({
            rsvp_id: rsvpId,
            name: guest.name,
            dietary_restrictions: guest.dietaryRestrictions
          }));
          
        if (additionalGuestsToInsert.length > 0) {
          const { error: additionalGuestsError } = await supabase
            .from('additional_guests')
            .insert(additionalGuestsToInsert);
            
          if (additionalGuestsError) throw additionalGuestsError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }
  };

  const handleSubmitRsvp = async (formData: RsvpFormValues) => {
    if (!guestInfo) return;
    
    setIsSubmitting(true);
    
    try {
      if (existingRsvp) {
        // Update existing RSVP
        await updateExistingRsvp(existingRsvp.id, formData);
        toast.success('RSVP aggiornato con successo!');
      } else {
        // Create new RSVP
        await submitRsvpResponse(
          guestInfo.id,
          formData.attending === 'yes',
          formData.dietaryRestrictions,
          formData.songRequest,
          formData.additionalGuests
        );
        toast.success('RSVP inviato con successo!');
      }
      
      handleRsvpSubmitted();
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast.error('Si è verificato un errore durante l\'invio dell\'RSVP. Per favore, riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare default values for existing RSVP
  const getDefaultValues = (): Partial<RsvpFormValues> => {
    const baseValues = {
      email: verifiedEmail,
      fullName: guestInfo?.name || '', // Pre-fill with guest name from invited_guests table
    };
    
    if (!existingRsvp) {
      return baseValues;
    }
    
    return {
      ...baseValues,
      attending: existingRsvp.attending ? 'yes' : 'no',
      dietaryRestrictions: existingRsvp.dietary_restrictions || '',
      songRequest: existingRsvp.message || '',
      additionalGuests: existingRsvp.additional_guests?.map(guest => ({
        name: guest.name,
        dietaryRestrictions: guest.dietary_restrictions || ''
      })) || [],
      hasPlusOne: (existingRsvp.additional_guests?.length || 0) > 0
    };
  };

  return (
    <div className="section-container bg-autumn-cream bg-opacity-10" id="rsvp">
      <h2 className="section-title">RSVP</h2>
      
      {step === 'email' ? (
        <>
          <p className="text-center text-gray-700 mb-8 max-w-2xl mx-auto">
            Per favore, inserisci la tua email per verificare il tuo invito
          </p>
          <EmailVerificationForm onEmailVerified={handleEmailVerified} />
        </>
      ) : (
        <>
          <p className="text-center text-gray-700 mb-8 max-w-2xl mx-auto">
            {verifiedEmail && (
              <span className="block font-medium text-autumn-terracotta mb-2">
                Email verificata: {verifiedEmail}
              </span>
            )}
            {existingRsvp && (
              <span className="block text-sm text-autumn-gold mb-2">
                Stai aggiornando la tua risposta precedente
              </span>
            )}
            Vi preghiamo di confermare la vostra presenza entro il 15 Agosto 2025. Saremo felici di avervi con noi in questo giorno speciale!
          </p>
          
          {guestInfo && (
            <RsvpFormFields 
              verifiedEmail={verifiedEmail}
              onSubmit={handleSubmitRsvp}
              isSubmitting={isSubmitting}
              defaultValues={getDefaultValues()}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RsvpForm;
