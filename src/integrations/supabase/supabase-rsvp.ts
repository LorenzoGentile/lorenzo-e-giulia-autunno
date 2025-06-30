
import { supabase } from './client';

export interface GuestInfo {
  id: string;
  name: string;
}

export const fetchGuestInfo = async (email: string): Promise<GuestInfo | null> => {
  try {
    console.log('fetchGuestInfo called with email:', email);
    
    // Use exact match first, then try case-insensitive
    let { data, error } = await supabase
      .from('invited_guests')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .limit(1);
      
    if (error) {
      console.error('Error with exact match:', error);
      
      // Try case-insensitive search as fallback
      const fallbackResult = await supabase
        .from('invited_guests')
        .select('id, name')
        .ilike('email', email.toLowerCase())
        .limit(1);
        
      if (fallbackResult.error) {
        console.error('Error with case-insensitive search:', fallbackResult.error);
        return null;
      }
      
      data = fallbackResult.data;
    }
    
    console.log('fetchGuestInfo database response:', data);
    
    if (data && data.length > 0) {
      return data[0];
    }
    
    return null;
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
    console.log('Submitting RSVP for guest ID:', guestId);
    
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
      
    if (rsvpError) {
      console.error('Error inserting RSVP response:', rsvpError);
      throw rsvpError;
    }
    
    console.log('RSVP response inserted:', rsvpData);
    
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
        console.log('Inserting additional guests:', additionalGuestsToInsert);
        
        const { error: additionalGuestsError } = await supabase
          .from('additional_guests')
          .insert(additionalGuestsToInsert);
          
        if (additionalGuestsError) {
          console.error('Error inserting additional guests:', additionalGuestsError);
          throw additionalGuestsError;
        }
        
        console.log('Additional guests inserted successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting RSVP:', error);
    throw error;
  }
};
