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
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface ShuttlePreference {
  id: string;
  guest_id: string;
  interested: boolean;
  outbound_wanted: boolean;
  outbound_location: string | null;
  outbound_alternative_location: string | null;
  return_wanted: boolean;
  return_time: string | null;
  number_of_people: number;
  invited_guests: {
    name: string;
  };
}

const ShuttleManagement = () => {
  const [preferences, setPreferences] = useState<ShuttlePreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("shuttle_preferences")
        .select(`
          *,
          invited_guests (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPreferences(data || []);
    } catch (error: any) {
      console.error("Error fetching shuttle preferences:", error);
      toast.error("Errore nel caricamento delle preferenze");
    } finally {
      setLoading(false);
    }
  };

  const sendShuttleNotifications = async () => {
    try {
      setIsSendingNotifications(true);
      console.log("Sending shuttle notifications to all attending guests");

      const { data, error } = await supabase.functions.invoke('send-shuttle-notification', {
        body: {}
      });

      if (error) throw error;

      toast.success(data.message || `Inviati ${data.sent} email di notifica navette`);
    } catch (error: any) {
      console.error("Error sending shuttle notifications:", error);
      toast.error(error.message || "Errore nell'invio delle notifiche navette");
    } finally {
      setIsSendingNotifications(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  const interestedCount = preferences.filter(p => p.interested).length;
  const totalPeople = preferences
    .filter(p => p.interested)
    .reduce((sum, p) => sum + (p.number_of_people || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Navette</CardTitle>
        <CardDescription>
          {interestedCount} invitati interessati • {totalPeople} persone totali
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Notification Button */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={sendShuttleNotifications}
            disabled={isSendingNotifications}
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
                Invia Notifica Navette a Tutti gli Invitati Confermati
              </>
            )}
          </Button>
        </div>
        
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Invitato</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Andata</TableHead>
                <TableHead>Ritorno</TableHead>
                <TableHead className="text-right">N. Persone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preferences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessuna preferenza registrata
                  </TableCell>
                </TableRow>
              ) : (
                preferences.map((pref) => (
                  <TableRow key={pref.id}>
                    <TableCell className="font-medium">
                      {pref.invited_guests?.name || "Nome non disponibile"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pref.interested ? "default" : "secondary"}>
                        {pref.interested ? "Sì" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pref.interested && pref.outbound_wanted ? (
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
                      {pref.interested && pref.return_wanted ? (
                        <div className="text-sm">
                          <strong>Orario:</strong> {pref.return_time || "-"}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {pref.interested ? pref.number_of_people : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShuttleManagement;
