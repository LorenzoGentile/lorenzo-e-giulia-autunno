
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, Edit3, Plus, Minus, Trash2 } from 'lucide-react';

interface GuestData {
  id: string;
  name: string;
  email: string;
  attending?: boolean;
  dietary_restrictions?: string;
  message?: string;
  created_at?: string;
  rsvp_id?: string;
  additional_guests?: Array<{
    id: string;
    name: string;
    dietary_restrictions?: string;
  }>;
}

interface AdditionalGuest {
  name: string;
  dietary_restrictions: string;
}

const RsvpManagement = () => {
  const { toast } = useToast();
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);

  useEffect(() => {
    loadGuestData();
  }, []);

  const loadGuestData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading guest data...');
      
      // Load guests and their RSVP responses
      const [guestsResult, rsvpsResult, additionalGuestsResult] = await Promise.all([
        supabase.from('invited_guests').select('*').order('name'),
        supabase.from('rsvp_responses').select('*'),
        supabase.from('additional_guests').select('*')
      ]);

      if (guestsResult.error) throw guestsResult.error;
      if (rsvpsResult.error) throw rsvpsResult.error;
      if (additionalGuestsResult.error) throw additionalGuestsResult.error;

      console.log('Additional guests data:', additionalGuestsResult.data);
      console.log('RSVP responses:', rsvpsResult.data);

      // Combine guest and RSVP data
      const guestData: GuestData[] = guestsResult.data?.map(guest => {
        const rsvp = rsvpsResult.data?.find(r => r.guest_id === guest.id);
        const guestAdditionalGuests = additionalGuestsResult.data?.filter(ag => ag.rsvp_id === rsvp?.id) || [];
        
        console.log(`Guest ${guest.name} - RSVP ID: ${rsvp?.id}, Additional guests:`, guestAdditionalGuests);
        
        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          attending: rsvp?.attending,
          dietary_restrictions: rsvp?.dietary_restrictions,
          message: rsvp?.message,
          created_at: rsvp?.created_at,
          rsvp_id: rsvp?.id,
          additional_guests: guestAdditionalGuests
        };
      }) || [];

      console.log('Final guest data with additional guests:', guestData);
      setGuests(guestData);
    } catch (error: any) {
      console.error('Error loading guest data:', error);
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load guest and RSVP data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRsvpDialog = (guest: GuestData) => {
    console.log('Opening RSVP dialog for guest:', guest);
    setSelectedGuest(guest);
    setAttending(guest.attending !== undefined ? (guest.attending ? 'yes' : 'no') : 'yes');
    setDietaryRestrictions(guest.dietary_restrictions || '');
    setSongRequest(guest.message || '');
    setHasPlusOne((guest.additional_guests?.length || 0) > 0);
    setAdditionalGuests(guest.additional_guests?.map(ag => ({
      name: ag.name,
      dietary_restrictions: ag.dietary_restrictions || ''
    })) || []);
    setIsDialogOpen(true);
  };

  const addAdditionalGuest = () => {
    setAdditionalGuests([...additionalGuests, { name: '', dietary_restrictions: '' }]);
  };

  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  const updateAdditionalGuest = (index: number, field: keyof AdditionalGuest, value: string) => {
    const updated = [...additionalGuests];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalGuests(updated);
  };

  const deleteExistingRsvp = async (rsvpId: string) => {
    try {
      console.log('Deleting existing RSVP and additional guests for RSVP ID:', rsvpId);
      
      // First delete additional guests
      const { error: deleteGuestsError } = await supabase
        .from('additional_guests')
        .delete()
        .eq('rsvp_id', rsvpId);
      
      if (deleteGuestsError) throw deleteGuestsError;
      
      // Then delete the main RSVP response
      const { error: deleteRsvpError } = await supabase
        .from('rsvp_responses')
        .delete()
        .eq('id', rsvpId);
      
      if (deleteRsvpError) throw deleteRsvpError;
      
      return true;
    } catch (error) {
      console.error('Error deleting existing RSVP:', error);
      throw error;
    }
  };

  const handleSubmitRsvp = async () => {
    if (!selectedGuest) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting RSVP for guest:', selectedGuest.name);
      console.log('Additional guests to save:', additionalGuests);
      
      // Delete existing RSVP if it exists
      if (selectedGuest.rsvp_id) {
        await deleteExistingRsvp(selectedGuest.rsvp_id);
      }
      
      // Insert new RSVP response
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvp_responses')
        .insert({
          guest_id: selectedGuest.id,
          attending: attending === 'yes',
          dietary_restrictions: dietaryRestrictions || null,
          message: songRequest || null,
        })
        .select('id')
        .single();
        
      if (rsvpError) throw rsvpError;
      
      console.log('New RSVP created with ID:', rsvpData?.id);
      
      // Insert additional guests if attending and there are any
      if (attending === 'yes' && hasPlusOne && additionalGuests.length > 0 && rsvpData?.id) {
        const additionalGuestsToInsert = additionalGuests
          .filter(guest => guest.name.trim() !== '')
          .map(guest => ({
            rsvp_id: rsvpData.id,
            name: guest.name,
            dietary_restrictions: guest.dietary_restrictions || null
          }));
          
        console.log('Inserting additional guests:', additionalGuestsToInsert);
          
        if (additionalGuestsToInsert.length > 0) {
          const { error: additionalGuestsError } = await supabase
            .from('additional_guests')
            .insert(additionalGuestsToInsert);
            
          if (additionalGuestsError) throw additionalGuestsError;
          console.log('Additional guests inserted successfully');
        }
      }
      
      toast({
        title: "RSVP saved successfully",
        description: `RSVP for ${selectedGuest.name} has been ${selectedGuest.rsvp_id ? 'updated' : 'created'}`,
      });
      
      setIsDialogOpen(false);
      await loadGuestData(); // Refresh the data
    } catch (error: any) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: "Error saving RSVP",
        description: error.message || "Failed to save RSVP response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            RSVP Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>RSVP Status</TableHead>
                  <TableHead>Additional Guests</TableHead>
                  <TableHead>Response Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map(guest => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>
                      {guest.attending === undefined ? (
                        <Badge variant="secondary">No Response</Badge>
                      ) : guest.attending ? (
                        <Badge variant="default" className="bg-green-600">Attending</Badge>
                      ) : (
                        <Badge variant="destructive">Not Attending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.additional_guests && guest.additional_guests.length > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="outline">{guest.additional_guests.length} guest(s)</Badge>
                          <div className="text-xs text-gray-600">
                            {guest.additional_guests.map((ag, index) => (
                              <div key={index}>{ag.name}</div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog open={isDialogOpen && selectedGuest?.id === guest.id} onOpenChange={(open) => {
                        if (!open) setIsDialogOpen(false);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRsvpDialog(guest)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            {guest.rsvp_id ? 'Edit' : 'Add'} RSVP
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {guest.rsvp_id ? 'Edit' : 'Add'} RSVP for {guest.name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Attendance */}
                            <div className="space-y-4">
                              <Label className="text-base font-medium">Will they attend the wedding?</Label>
                              <RadioGroup 
                                value={attending} 
                                onValueChange={(value: 'yes' | 'no') => setAttending(value)}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="yes" id="attending-yes" />
                                  <Label htmlFor="attending-yes">Yes, they will attend</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no" id="attending-no" />
                                  <Label htmlFor="attending-no">No, they cannot attend</Label>
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
                                    <Checkbox
                                      id="hasPlusOne"
                                      checked={hasPlusOne}
                                      onCheckedChange={(checked) => {
                                        setHasPlusOne(!!checked);
                                        if (!checked) {
                                          setAdditionalGuests([]);
                                        }
                                      }}
                                    />
                                    <Label htmlFor="hasPlusOne" className="text-base">Will they bring additional guests?</Label>
                                  </div>
                                </div>
                                
                                {/* Additional Guests */}
                                {hasPlusOne && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-base">Additional Guests</Label>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addAdditionalGuest}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Guest
                                      </Button>
                                    </div>
                                    
                                    {additionalGuests.map((guest, index) => (
                                      <Card key={index} className="p-4">
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Guest {index + 1}</h4>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeAdditionalGuest(index)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          
                                          <div>
                                            <Label htmlFor={`guest-${index}-name`}>Name</Label>
                                            <Input
                                              id={`guest-${index}-name`}
                                              value={guest.name}
                                              onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                                              placeholder="Guest name"
                                            />
                                          </div>
                                          
                                          <div>
                                            <Label htmlFor={`guest-${index}-dietary`}>Dietary Restrictions</Label>
                                            <Textarea
                                              id={`guest-${index}-dietary`}
                                              value={guest.dietary_restrictions}
                                              onChange={(e) => updateAdditionalGuest(index, 'dietary_restrictions', e.target.value)}
                                              placeholder="Any dietary restrictions or allergies"
                                            />
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                                
                                <Separator />
                                
                                {/* Dietary Restrictions */}
                                <div>
                                  <Label htmlFor="dietaryRestrictions" className="text-base">Dietary Restrictions or Allergies</Label>
                                  <Textarea
                                    id="dietaryRestrictions"
                                    value={dietaryRestrictions}
                                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                                    placeholder="Any dietary restrictions or allergies"
                                  />
                                </div>
                                
                                <Separator />
                                
                                {/* Song Request */}
                                <div>
                                  <Label htmlFor="songRequest" className="text-base">Song Request</Label>
                                  <Textarea
                                    id="songRequest"
                                    value={songRequest}
                                    onChange={(e) => setSongRequest(e.target.value)}
                                    placeholder="Any song requests for the reception"
                                  />
                                </div>
                              </>
                            )}
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSubmitRsvp}
                                disabled={isSubmitting}
                                className="autumn-button"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save RSVP'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RsvpManagement;
