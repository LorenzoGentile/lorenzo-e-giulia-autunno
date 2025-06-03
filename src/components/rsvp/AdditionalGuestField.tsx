
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdditionalGuestValues } from "@/types/rsvp";

interface AdditionalGuestFieldProps {
  index: number;
  guest: AdditionalGuestValues;
  updateGuest: (index: number, field: keyof AdditionalGuestValues, value: string) => void;
  error?: string;
}

const AdditionalGuestField: React.FC<AdditionalGuestFieldProps> = ({
  index,
  guest,
  updateGuest,
  error
}) => {
  return (
    <div className="autumn-card p-4 space-y-3">
      <h3 className="font-medium text-lg">Ospite {index + 1}</h3>
      
      <div>
        <Label htmlFor={`guest-${index}-name`} className="text-sm">
          Nome e Cognome
        </Label>
        <Input
          id={`guest-${index}-name`}
          value={guest.name}
          onChange={(e) => updateGuest(index, 'name', e.target.value)}
          className={error ? 'border-red-500' : ''}
        />
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor={`guest-${index}-dietary`} className="text-sm">
          Restrizioni alimentari
        </Label>
        <Textarea
          id={`guest-${index}-dietary`}
          value={guest.dietaryRestrictions}
          onChange={(e) => updateGuest(index, 'dietaryRestrictions', e.target.value)}
          placeholder="Indica eventuali allergie o preferenze alimentari"
          className="mt-1"
        />
      </div>
    </div>
  );
};

export default AdditionalGuestField;
