import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface InvitedGuest {
  id: string;
  name: string;
  email: string;
  shuttle_notification_count?: number;
  shuttle_notification_sent_at?: string;
  shuttle_preferences?: Array<{
    id: string;
    interested: boolean;
    outbound_wanted: boolean;
    outbound_location: string | null;
    outbound_alternative_location: string | null;
    return_wanted: boolean;
    return_time: string | null;
    number_of_people: number;
  }> | null;
}

const ShuttleManagement = () => {
  const [guests, setGuests] = useState<InvitedGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      console.log("Fetching guests with RSVP attending=true and shuttle preferences...");
      
      const { data, error } = await supabase
        .from("invited_guests")
        .select(`
          id,
          name,
          email,
          shuttle_notification_count,
          shuttle_notification_sent_at,
          rsvp_responses!inner(
            attending
          ),
          shuttle_preferences (
            id,
            interested,
            outbound_wanted,
            outbound_location,
            outbound_alternative_location,
            return_wanted,
            return_time,
            number_of_people
          )
        `)
        .eq('rsvp_responses.attending', true)
        .order("name", { ascending: true });

      if (error) throw error;

      console.log("Query result:", data);
      console.log(`Found ${data?.length || 0} guests with attending RSVP`);

      setGuests(data as any || []);
    } catch (error: any) {
      console.error("Error fetching guests:", error);
      toast.error("Errore nel caricamento degli invitati");
    } finally {
      setLoading(false);
    }
  };

  const sendShuttleNotifications = async () => {
    try {
      setIsSendingNotifications(true);
      const guestIds = Array.from(selectedGuests);
      console.log(`Sending shuttle notifications to ${guestIds.length} selected guests`);

      const { data, error } = await supabase.functions.invoke('send-shuttle-notification', {
        body: { guestIds }
      });

      if (error) throw error;

      toast.success(data.message || `Inviati ${data.sent} email di notifica navette`);
      setSelectedGuests(new Set());
    } catch (error: any) {
      console.error("Error sending shuttle notifications:", error);
      toast.error(error.message || "Errore nell'invio delle notifiche navette");
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const toggleAllGuests = () => {
    if (selectedGuests.size === guests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(guests.map(g => g.id)));
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  const respondedCount = guests.filter(g => g.shuttle_preferences && g.shuttle_preferences.length > 0).length;
  const interestedCount = guests.filter(g => g.shuttle_preferences?.[0]?.interested).length;
  const totalPeople = guests
    .filter(g => g.shuttle_preferences?.[0]?.interested)
    .reduce((sum, g) => sum + (g.shuttle_preferences?.[0]?.number_of_people || 0), 0);
  const totalEmailsSent = guests.reduce((sum, g) => sum + (g.shuttle_notification_count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Navette</CardTitle>
        <CardDescription>
          {guests.length} invitati totali • {totalEmailsSent} email inviate • {respondedCount} hanno risposto • {interestedCount} interessati • {totalPeople} persone • {selectedGuests.size} selezionati
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Notification Button */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={sendShuttleNotifications}
            disabled={isSendingNotifications || selectedGuests.size === 0}
            className="autumn-button"
          >
            {isSendingNotifications ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Invia Notifica Navette agli Invitati Selezionati ({selectedGuests.size})
              </>
            )}
          </Button>
        </div>
        
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedGuests.size === guests.length && guests.length > 0}
                    onCheckedChange={toggleAllGuests}
                  />
                </TableHead>
                <TableHead>Nome Invitato</TableHead>
                <TableHead>Email Inviate</TableHead>
                <TableHead>Stato Risposta</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Andata</TableHead>
                <TableHead>Ritorno</TableHead>
                <TableHead className="text-right">N. Persone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nessun invitato trovato
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => {
                  const pref = guest.shuttle_preferences?.[0];
                  const hasResponded = !!pref;
                  
                  return (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedGuests.has(guest.id)}
                          onCheckedChange={() => toggleGuestSelection(guest.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {guest.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {guest.shuttle_notification_count ? (
                            <Badge variant="outline">
                              {guest.shuttle_notification_count} {guest.shuttle_notification_count === 1 ? 'email' : 'emails'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Nessuna</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hasResponded ? "default" : "secondary"}>
                          {hasResponded ? "Risposto" : "Non risposto"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasResponded ? (
                          <Badge variant={pref.interested ? "default" : "secondary"}>
                            {pref.interested ? "Sì" : "No"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasResponded && pref.interested && pref.outbound_wanted ? (
                          <div className="text-sm space-y-1">
                            <div><strong>Luogo:</strong> {pref.outbound_location || "-"}</div>
                            {pref.outbound_alternative_location && (
                              <div><strong>Alternativa:</strong> {pref.outbound_alternative_location}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasResponded && pref.interested && pref.return_wanted ? (
                          <div className="text-sm">
                            <strong>Orario:</strong> {pref.return_time || "-"}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasResponded && pref.interested ? pref.number_of_people : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShuttleManagement;
