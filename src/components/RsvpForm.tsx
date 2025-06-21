
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
  additional_guests?: AdditionalGuest[];
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
        console.log('User is logged in and invited, checking guest info for:', user.email);
        const info = await fetchGuestInfo(user.email);
        if (info) {
          console.log('Guest info found for logged in user:', info);
          setGuestInfo(info);
          setVerifiedEmail(user.email);
          
          // Check for existing RSVP for this logged-in user
          const existingRsvpData = await fetchExistingRsvpDetails(info.id);
          if (existingRsvpData) {
            console.log('Found existing RSVP for logged-in user:', existingRsvpData);
            setExistingRsvp(existingRsvpData);
          }
          
          setStep('rsvp');
        }
      }
    };
    
    checkUserAndInitialize();
  }, [user, isInvitedGuest]);

  const fetchExistingRsvpDetails = async (guestId: string) => {
    try {
      console.log('Fetching existing RSVP details for guest ID:', guestId);
      
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('*, additional_guests(*)')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching existing RSVP details:', error);
        throw error;
      }
      
      console.log('Raw RSVP query result:', data);
      
      if (data && data.length > 0) {
        console.log('Found existing RSVP details:', data[0]);
        return data[0];
      }
      
      console.log('No existing RSVP details found');
      return null;
    } catch (error) {
      console.error('Error fetching existing RSVP details:', error);
      return null;
    }
  };

  const handleEmailVerified = async (email: string, info: GuestInfo, existingRsvpData?: { id: string; attending: boolean; created_at: string }) => {
    console.log('Email verified:', email, 'Guest info:', info, 'Existing RSVP basic data:', existingRsvpData);
    
    setVerifiedEmail(email);
    setGuestInfo(info);
    
    if (existingRsvpData) {
      console.log('Fetching full RSVP details for existing RSVP ID:', existingRsvpData.id);
      // Fetch full RSVP details including additional guests
      const fullRsvpData = await fetchExistingRsvpDetails(info.id);
      if (fullRsvpData) {
        console.log('Setting full existing RSVP data:', fullRsvpData);
        setExistingRsvp(fullRsvpData);
      } else {
        console.log('Could not fetch full RSVP details, but we know one exists');
        // If we can't fetch full details but we know an RSVP exists, 
        // create a minimal existing RSVP object
        setExistingRsvp({
          id: existingRsvpData.id,
          attending: existingRsvpData.attending,
          created_at: existingRsvpData.created_at,
          additional_guests: []
        });
      }
    } else {
      console.log('No existing RSVP data provided');
      setExistingRsvp(null);
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

  const deleteExistingRsvp = async (rsvpId: string) => {
    try {
      console.log('Deleting existing RSVP and additional guests for RSVP ID:', rsvpId);
      
      // First delete additional guests
      const { error: deleteGuestsError } = await supabase
        .from('additional_guests')
        .delete()
        .eq('rsvp_id', rsvpId);
      
      if (deleteGuestsError) {
        console.error('Error deleting additional guests:', deleteGuestsError);
        throw deleteGuestsError;
      }
      
      // Then delete the main RSVP response
      const { error: deleteRsvpError } = await supabase
        .from('rsvp_responses')
        .delete()
        .eq('id', rsvpId);
      
      if (deleteRsvpError) {
        console.error('Error deleting RSVP response:', deleteRsvpError);
        throw deleteRsvpError;
      }
      
      console.log('Successfully deleted existing RSVP and additional guests');
      return true;
    } catch (error) {
      console.error('Error deleting existing RSVP:', error);
      throw error;
    }
  };

  const handleSubmitRsvp = async (formData: RsvpFormValues) => {
    if (!guestInfo) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting RSVP. Existing RSVP:', existingRsvp);
      
      if (existingRsvp) {
        console.log('Deleting existing RSVP before creating new one');
        // Delete existing RSVP and additional guests before creating new ones
        await deleteExistingRsvp(existingRsvp.id);
        toast.success('Risposta precedente rimossa. Creazione nuova risposta...');
      }
      
      // Always create new RSVP (whether replacing existing or creating first time)
      await submitRsvpResponse(
        guestInfo.id,
        formData.attending === 'yes',
        formData.dietaryRestrictions,
        formData.songRequest,
        formData.additionalGuests
      );
      
      if (existingRsvp) {
        toast.success('RSVP aggiornato con successo!');
      } else {
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
      console.log('No existing RSVP, using base values:', baseValues);
      return baseValues;
    }
    
    const defaultValues: Partial<RsvpFormValues> = {
      ...baseValues,
      attending: existingRsvp.attending ? ('yes' as const) : ('no' as const),
      dietaryRestrictions: existingRsvp.dietary_restrictions || '',
      songRequest: existingRsvp.message || '',
      additionalGuests: existingRsvp.additional_guests?.map(guest => ({
        name: guest.name,
        dietaryRestrictions: guest.dietary_restrictions || ''
      })) || [],
      hasPlusOne: (existingRsvp.additional_guests?.length || 0) > 0
    };
    
    console.log('Using existing RSVP default values:', defaultValues);
    return defaultValues;
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
                Hai già risposto precedentemente. I campi sono precompilati con le tue risposte precedenti. 
                Quando invii il form, la risposta precedente verrà sostituita completamente.
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
