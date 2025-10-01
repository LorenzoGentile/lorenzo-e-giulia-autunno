import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

export const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Cerca un indirizzo...",
  required,
  id 
}: AddressAutocompleteProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDzVkyis1gJtr9QyUAXXxqK2ZzOXITxZ_4&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      initAutocomplete();
    };
    
    script.onerror = () => {
      setError("Errore nel caricamento di Google Maps");
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initAutocomplete = async () => {
    if (!containerRef.current) return;

    try {
      // @ts-ignore - Google Maps types
      await google.maps.importLibrary("places");
      
      // @ts-ignore - PlaceAutocompleteElement is new
      const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: 'it' },
      });

      // Style the autocomplete element
      placeAutocomplete.style.width = '100%';
      
      // Clear container and append the autocomplete element
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(placeAutocomplete);

      // Listen for place selection
      // @ts-ignore
      placeAutocomplete.addEventListener('gmp-placeselect', async ({ placePrediction }) => {
        try {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
          
          const address = place.formattedAddress || place.displayName || '';
          onChange(address);
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
      });

    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      setError("Errore nell'inizializzazione dell'autocomplete");
    }
  };

  // Fallback to regular input if there's an error
  if (error) {
    return (
      <div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground mt-1">Autocomplete non disponibile. Inserisci l'indirizzo manualmente.</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="w-full" />
      {!isLoaded && (
        <input
          type="text"
          value={value}
          placeholder="Caricamento..."
          disabled
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground opacity-50"
        />
      )}
    </div>
  );
};
