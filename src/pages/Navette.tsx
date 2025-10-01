import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
const Navette = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    interested: true,
    outbound_wanted: false,
    outbound_location: "",
    outbound_alternative_available: false,
    return_wanted: false,
    return_time: "",
    number_of_people: 1
  });
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchGuestIdAndPreferences();
    }
  }, [user, isLoading, navigate]);
  const fetchGuestIdAndPreferences = async () => {
    if (!user?.email) return;
    try {
      const {
        data: guestData,
        error: guestError
      } = await supabase.from("invited_guests").select("id").eq("email", user.email).single();
      if (guestError) throw guestError;
      setGuestId(guestData.id);

      // Check if preferences already exist
      const {
        data: prefsData,
        error: prefsError
      } = await supabase.from("shuttle_preferences").select("*").eq("guest_id", guestData.id).maybeSingle();
      if (prefsError && prefsError.code !== 'PGRST116') throw prefsError;
      if (prefsData) {
        setFormData({
          interested: prefsData.interested,
          outbound_wanted: prefsData.outbound_wanted || false,
          outbound_location: prefsData.outbound_location || "",
          outbound_alternative_available: prefsData.outbound_alternative_location ? true : false,
          return_wanted: prefsData.return_wanted || false,
          return_time: prefsData.return_time || "",
          number_of_people: prefsData.number_of_people || 1
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Errore nel caricamento dei dati");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId) {
      toast.error("Errore: guest non identificato");
      return;
    }
    setLoading(true);
    try {
      // Save preferences to database
      const {
        error
      } = await supabase.from("shuttle_preferences").upsert({
        guest_id: guestId,
        interested: formData.interested,
        outbound_wanted: formData.outbound_wanted,
        outbound_location: formData.outbound_location,
        outbound_alternative_location: formData.outbound_alternative_available ? "Sì" : null,
        return_wanted: formData.return_wanted,
        return_time: formData.return_time || null,
        number_of_people: formData.number_of_people
      }, {
        onConflict: 'guest_id'
      });
      if (error) throw error;

      // Get guest name for email
      const {
        data: guestData
      } = await supabase.from("invited_guests").select("name").eq("id", guestId).single();

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-shuttle-confirmation", {
          body: {
            guestName: guestData?.name || "Ospite",
            guestEmail: user?.email,
            interested: formData.interested,
            outboundWanted: formData.outbound_wanted,
            outboundLocation: formData.outbound_location,
            returnWanted: formData.return_wanted,
            returnTime: formData.return_time,
            numberOfPeople: formData.number_of_people
          }
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't block the user if email fails
      }
      toast.success("Preferenze salvate con successo!");
      navigate("/");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Errore nel salvataggio delle preferenze");
    } finally {
      setLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Navette</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Stiamo cercando di organizzare delle navette per facilitare gli spostamenti 
              verso e dalla location del matrimonio. Ti chiediamo di compilare il form qui 
              sotto indicando se sei interessato e le tue preferenze.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Interest */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Interesse per navetta</Label>
                <RadioGroup value={formData.interested ? "yes" : "no"} onValueChange={value => setFormData({
                ...formData,
                interested: value === "yes"
              })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="font-normal cursor-pointer">Sì, sono interessato</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="font-normal cursor-pointer">No, non sono interessato</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.interested && <>
                  {/* Outbound Trip */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Andata</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="outbound_wanted" checked={formData.outbound_wanted} onCheckedChange={checked => setFormData({
                    ...formData,
                    outbound_wanted: checked as boolean
                  })} />
                      <Label htmlFor="outbound_wanted" className="font-normal cursor-pointer">
                        Vuoi il passaggio all'andata?
                      </Label>
                    </div>

                    {formData.outbound_wanted && <div className="space-y-4 ml-6">
                        <div>
                          <Label htmlFor="outbound_location">Luogo di partenza preferito *</Label>
                          <AddressAutocomplete id="outbound_location" value={formData.outbound_location} onChange={value => setFormData({
                      ...formData,
                      outbound_location: value
                    })} placeholder="Es. Milano Centrale, Via Roma 1" required />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox id="outbound_alternative" checked={formData.outbound_alternative_available} onCheckedChange={checked => setFormData({
                      ...formData,
                      outbound_alternative_available: checked as boolean
                    })} />
                          <Label htmlFor="outbound_alternative" className="font-normal cursor-pointer">
                            Sei disponibile a partire anche da un altro luogo?
                          </Label>
                        </div>
                      </div>}
                  </div>

                  {/* Return Trip */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Ritorno</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="return_wanted" checked={formData.return_wanted} onCheckedChange={checked => setFormData({
                    ...formData,
                    return_wanted: checked as boolean
                  })} />
                      <Label htmlFor="return_wanted" className="font-normal cursor-pointer">
                        Vuoi il passaggio al ritorno?
                      </Label>
                    </div>

                    {formData.return_wanted && <div className="ml-6 space-y-3">
                        <Label className="text-base">Fascia oraria preferita *</Label>
                        <RadioGroup value={formData.return_time} onValueChange={value => setFormData({
                    ...formData,
                    return_time: value
                  })} required>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="18:30-20:00" id="time1" />
                            <Label htmlFor="time1" className="font-normal cursor-pointer">18:30-20:00 (dopo il taglio della torta 🍰)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="20:00-21:00" id="time2" />
                            <Label htmlFor="time2" className="font-normal cursor-pointer">20:00-21:00 (Dopo aver ballato un po' 💃)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="21:30-22:00" id="time3" />
                            <Label htmlFor="time3" className="font-normal cursor-pointer">21:30-22:00 (Dopo aver festeggiato per bene 🥳)</Label>
                          </div>
                        </RadioGroup>
                      </div>}
                  </div>

                  {/* Number of People */}
                  <div className="pt-4 border-t">
                    <Label htmlFor="number_of_people">Numero di persone *</Label>
                    <Input id="number_of_people" type="number" min="1" value={formData.number_of_people} onChange={e => setFormData({
                  ...formData,
                  number_of_people: parseInt(e.target.value) || 1
                })} required />
                  </div>
                </>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Invio in corso..." : "Invia preferenze"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>;
};
export default Navette;