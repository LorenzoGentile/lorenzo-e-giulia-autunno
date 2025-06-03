
import { supabase } from './client';

export interface GuestInfo {
  id: string;
  name: string;
}

export const fetchGuestInfo = async (email: string): Promise<GuestInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('invited_guests')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .single();
      
    if (error) {
      console.error('Error fetching guest info:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching guest info:', error);
    return null;
  }
};

export const submitRsvpResponse = async (
  guestId: string,
  attending: boolean,
  dietaryRestrictions: string | undefined,
  message: string | undefined,
  additionalGuests: Array<{ name: string; dietaryRestrictions?: string }>
) => {
  try {
    // Insert RSVP response
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvp_responses')
      .insert({
        guest_id: guestId,
        attending: attending,
        dietary_restrictions: dietaryRestrictions,
        message: message,
      })
      .select('id')
      .single();
      
    if (rsvpError) throw rsvpError;
    
    // Insert additional guests if attending and there are any
    if (attending && additionalGuests.length > 0 && rsvpData?.id) {
      const additionalGuestsToInsert = additionalGuests
        .filter(guest => guest.name.trim() !== '')
        .map(guest => ({
          rsvp_id: rsvpData.id,
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
    console.error('Error submitting RSVP:', error);
    throw error;
  }
};
