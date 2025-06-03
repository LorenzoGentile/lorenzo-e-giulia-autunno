import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import AdditionalGuestField from "./AdditionalGuestField";
import { RsvpFormValues, AdditionalGuestValues } from "@/types/rsvp";

interface RsvpFormFieldsProps {
  onSubmit: (data: RsvpFormValues) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<RsvpFormValues>;
  verifiedEmail?: string;
}

const RsvpFormFields: React.FC<RsvpFormFieldsProps> = ({ 
  onSubmit,
  isSubmitting,
  defaultValues = {},
  verifiedEmail
}) => {
  // Form state
  const [fullName, setFullName] = useState(defaultValues.fullName || '');
  const [email, setEmail] = useState(verifiedEmail || defaultValues.email || '');
  const [attending, setAttending] = useState<'yes' | 'no'>(defaultValues.attending || 'yes');
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuestValues[]>(
    defaultValues.additionalGuests || []
  );
  const [numAdditionalGuests, setNumAdditionalGuests] = useState(additionalGuests.length || 0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(defaultValues.dietaryRestrictions || '');
  const [hasPlusOne, setHasPlusOne] = useState(defaultValues.hasPlusOne ?? false);
  const [songRequest, setSongRequest] = useState(defaultValues.songRequest || '');
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Il nome è obbligatorio';
    }
    
    if (!email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }
    
    // Check additional guests if attending
    if (attending === 'yes' && hasPlusOne && numAdditionalGuests > 0) {
      additionalGuests.forEach((guest, index) => {
        if (!guest.name.trim()) {
          newErrors[`guest-${index}-name`] = 'Il nome dell\'ospite è obbligatorio';
        }
      });
    }
    
    // If there are errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Per favore, correggi gli errori nel form');
      return;
    }
    
    // Clear errors
    setErrors({});
    
    // Prepare form data
    const formData: RsvpFormValues = {
      fullName,
      email,
      attending,
      hasPlusOne,
      additionalGuests: attending === 'yes' && hasPlusOne ? additionalGuests : [],
      dietaryRestrictions,
      songRequest
    };
    
    // Submit the form
    onSubmit(formData);
  };
  
  // Update number of additional guest fields
  const handleNumGuestsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setNumAdditionalGuests(count);
    
    // Adjust the additional guests array
    if (count <= additionalGuests.length) {
      // Remove excess guests
      setAdditionalGuests(additionalGuests.slice(0, count));
    } else {
      // Add more guest fields
      const newGuests = [...additionalGuests];
      
      // Add more if needed
      while (newGuests.length < count) {
        // Ensure name is always initialized with a non-empty string to satisfy the type requirement
        newGuests.push({ name: '', dietaryRestrictions: '' });
      }
      
      setAdditionalGuests(newGuests);
    }
  };
  
  // Update additional guest information
  const updateGuest = (index: number, field: keyof AdditionalGuestValues, value: string) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value
    };
    setAdditionalGuests(updatedGuests);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-base">Nome e Cognome</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={errors.fullName ? 'border-red-500' : ''}
            readOnly
            disabled
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Il nome viene dalla lista degli invitati e non può essere modificato
          </p>
        </div>
        
        <div>
          <Label htmlFor="email" className="text-base">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            readOnly
            disabled
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            L'email non può essere modificata dopo la verifica
          </p>
        </div>
      </div>
      
      <Separator />
      
      {/* Attendance */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Parteciperai al matrimonio?</Label>
        <RadioGroup 
          value={attending} 
          onValueChange={(value: 'yes' | 'no') => setAttending(value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="attending-yes" />
            <Label htmlFor="attending-yes">Sì, ci sarò</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="attending-no" />
            <Label htmlFor="attending-no">No, non posso partecipare</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Conditional fields based on attendance */}
      {attending === 'yes' && (
        <>
          <Separator />
          
          {/* Plus One Option */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasPlusOne"
                className="rounded border-gray-300 text-autumn-terracotta focus:ring-autumn-terracotta"
                checked={hasPlusOne}
                onChange={(e) => setHasPlusOne(e.target.checked)}
              />
              <Label htmlFor="hasPlusOne" className="text-base">Porterai degli ospiti con te?</Label>
            </div>
          </div>
          
          {/* Additional Guests (if has plus one) */}
          {hasPlusOne && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="numGuests" className="text-base">Quanti ospiti porterai?</Label>
                <select
                  id="numGuests"
                  value={numAdditionalGuests}
                  onChange={handleNumGuestsChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-autumn-terracotta focus:border-autumn-terracotta rounded-md"
                >
                  <option value="0">Seleziona</option>
                  <option value="1">1 ospite</option>
                  <option value="2">2 ospiti</option>
                  <option value="3">3 ospiti</option>
                  <option value="4">4 ospiti</option>
                </select>
              </div>
              
              {numAdditionalGuests > 0 && (
                <div className="space-y-6 mt-4">
                  {additionalGuests.map((guest, index) => (
                    <AdditionalGuestField
                      key={index}
                      index={index}
                      guest={guest}
                      updateGuest={updateGuest}
                      error={errors[`guest-${index}-name`]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          {/* Dietary Restrictions */}
          <div>
            <Label htmlFor="dietaryRestrictions" className="text-base">Hai delle restrizioni alimentari o allergie?</Label>
            <Textarea
              id="dietaryRestrictions"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="Indica eventuali allergie o preferenze alimentari"
              className="mt-1"
            />
          </div>
          
          <Separator />
          
          {/* Song Request */}
          <div>
            <Label htmlFor="songRequest" className="text-base">Vuoi richiedere una canzone per la festa?</Label>
            <Textarea
              id="songRequest"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
              placeholder="Dicci quale canzone vorresti ascoltare!"
              className="mt-1"
            />
          </div>
        </>
      )}
      
      <div className="pt-4">
        <Button 
          type="submit" 
          className="autumn-button w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Invio in corso...' : 'Invia RSVP'}
        </Button>
      </div>
    </form>
  );
};

export default RsvpFormFields;
