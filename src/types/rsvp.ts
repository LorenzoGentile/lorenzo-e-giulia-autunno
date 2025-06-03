
export interface AdditionalGuestValues {
  name: string;
  dietaryRestrictions: string;
}

export interface RsvpFormValues {
  fullName: string;
  email: string;
  attending: 'yes' | 'no';
  hasPlusOne: boolean;
  additionalGuests: AdditionalGuestValues[];
  dietaryRestrictions: string;
  songRequest: string;
}
