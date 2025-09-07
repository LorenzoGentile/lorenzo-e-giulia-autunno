import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, MapPin, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WeddingTable {
  id: string;
  table_number: number;
  table_name?: string;
  capacity: number;
  x_position: number;
  y_position: number;
  created_at: string;
  updated_at: string;
}

interface GuestWithTable {
  id: string;
  name: string;
  email: string;
  table_id?: string;
  type: 'invited' | 'additional';
  rsvp_attending?: boolean;
}

const TableManagement: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingAdmin } = useAdminRole();
  const [tables, setTables] = useState<WeddingTable[]>([]);
  const [guests, setGuests] = useState<GuestWithTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<WeddingTable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    table_number: '',
    table_name: '',
    capacity: '8'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadTables(), loadGuests()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async () => {
    const { data, error } = await supabase
      .from('wedding_tables')
      .select('*')
      .order('table_number');

    if (error) {
      console.error('Error loading tables:', error);
      throw error;
    }

    setTables(data || []);
  };

  const loadGuests = async () => {
    // Load invited guests with RSVP status
    const { data: invitedGuests, error: invitedError } = await supabase
      .from('invited_guests')
      .select(`
        id,
        name,
        email,
        table_id,
        rsvp_responses(attending)
      `);

    if (invitedError) {
      console.error('Error loading invited guests:', invitedError);
      throw invitedError;
    }

    // Load additional guests
    const { data: additionalGuests, error: additionalError } = await supabase
      .from('additional_guests')
      .select(`
        id,
        name,
        table_id,
        rsvp_id,
        rsvp_responses!rsvp_id(attending)
      `);

    if (additionalError) {
      console.error('Error loading additional guests:', additionalError);
      throw additionalError;
    }

    const formattedInvitedGuests: GuestWithTable[] = (invitedGuests || []).map(guest => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      table_id: guest.table_id,
      type: 'invited' as const,
      rsvp_attending: guest.rsvp_responses?.[0]?.attending
    }));

    const formattedAdditionalGuests: GuestWithTable[] = (additionalGuests || []).map(guest => ({
      id: guest.id,
      name: guest.name,
      email: '', // Additional guests don't have emails
      table_id: guest.table_id,
      type: 'additional' as const,
      rsvp_attending: guest.rsvp_responses?.attending
    }));

    setGuests([...formattedInvitedGuests, ...formattedAdditionalGuests]);
  };

  const createTable = async () => {
    if (!newTable.table_number || !newTable.capacity) {
      toast.error('Numero tavolo e capienza sono obbligatori');
      return;
    }

    try {
      const { error } = await supabase
        .from('wedding_tables')
        .insert({
          table_number: parseInt(newTable.table_number),
          table_name: newTable.table_name || null,
          capacity: parseInt(newTable.capacity)
        });

      if (error) {
        console.error('Error creating table:', error);
        toast.error('Errore nella creazione del tavolo');
        return;
      }

      toast.success('Tavolo creato con successo');
      setIsDialogOpen(false);
      setNewTable({ table_number: '', table_name: '', capacity: '8' });
      loadTables();
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Errore nella creazione del tavolo');
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('wedding_tables')
        .delete()
        .eq('id', tableId);

      if (error) {
        console.error('Error deleting table:', error);
        toast.error('Errore nella cancellazione del tavolo');
        return;
      }

      toast.success('Tavolo eliminato con successo');
      loadData();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Errore nella cancellazione del tavolo');
    }
  };

  const assignGuestToTable = async (guestId: string, guestType: 'invited' | 'additional', tableId: string | null) => {
    try {
      const table = guestType === 'invited' ? 'invited_guests' : 'additional_guests';
      
      const { error } = await supabase
        .from(table)
        .update({ table_id: tableId })
        .eq('id', guestId);

      if (error) {
        console.error('Error assigning guest to table:', error);
        toast.error('Errore nell\'assegnazione del tavolo');
        return;
      }

      toast.success('Assegnazione aggiornata');
      loadGuests();
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      toast.error('Errore nell\'assegnazione del tavolo');
    }
  };

  const getTableGuests = (tableId: string) => {
    return guests.filter(guest => guest.table_id === tableId);
  };

  const getUnassignedGuests = () => {
    return guests.filter(guest => !guest.table_id);
  };

  const getAttendingGuests = () => {
    return guests.filter(guest => guest.rsvp_attending === true);
  };

  // Show loading while checking admin status
  if (!user || isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-autumn-cream bg-opacity-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-autumn-burgundy mx-auto mb-4"></div>
          <p className="text-autumn-burgundy">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not admin
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-autumn-cream bg-opacity-10 p-6">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-autumn-cream bg-opacity-10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-autumn-burgundy">Gestione Tavoli</h1>
            <p className="text-gray-600 mt-2">
              Organizza la disposizione dei posti per il matrimonio
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="autumn-button">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Tavolo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crea Nuovo Tavolo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table_number">Numero Tavolo *</Label>
                  <Input
                    id="table_number"
                    type="number"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable(prev => ({ ...prev, table_number: e.target.value }))}
                    placeholder="Es. 1"
                  />
                </div>
                <div>
                  <Label htmlFor="table_name">Nome Tavolo (opzionale)</Label>
                  <Input
                    id="table_name"
                    value={newTable.table_name}
                    onChange={(e) => setNewTable(prev => ({ ...prev, table_name: e.target.value }))}
                    placeholder="Es. Tavolo degli Amici"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capienza *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="Es. 8"
                  />
                </div>
                <Button onClick={createTable} className="w-full autumn-button">
                  Crea Tavolo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-autumn-terracotta" />
                <div>
                  <p className="text-sm text-gray-600">Tavoli Totali</p>
                  <p className="text-2xl font-bold text-autumn-burgundy">{tables.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-autumn-terracotta" />
                <div>
                  <p className="text-sm text-gray-600">Ospiti Confermati</p>
                  <p className="text-2xl font-bold text-autumn-burgundy">{getAttendingGuests().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Ospiti Assegnati</p>
                <p className="text-2xl font-bold text-autumn-burgundy">
                  {guests.filter(g => g.table_id).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Ospiti Non Assegnati</p>
                <p className="text-2xl font-bold text-autumn-burgundy">
                  {getUnassignedGuests().length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tables.map((table) => {
            const tableGuests = getTableGuests(table.id);
            const isOverCapacity = tableGuests.length > table.capacity;
            
            return (
              <Card key={table.id} className={`relative ${isOverCapacity ? 'border-red-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-autumn-burgundy">
                        Tavolo {table.table_number}
                      </CardTitle>
                      {table.table_name && (
                        <p className="text-sm text-gray-600">{table.table_name}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isOverCapacity ? "destructive" : "secondary"}>
                        {tableGuests.length}/{table.capacity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTable(table.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tableGuests.length === 0 ? (
                      <p className="text-gray-500 italic">Nessun ospite assegnato</p>
                    ) : (
                      tableGuests.map((guest) => (
                        <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{guest.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {guest.type === 'invited' ? 'Invitato' : 'Accompagnatore'}
                              </Badge>
                              {guest.rsvp_attending === true && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  Confermato
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Select
                            value={guest.table_id || "unassigned"}
                            onValueChange={(value) => 
                              assignGuestToTable(
                                guest.id, 
                                guest.type, 
                                value === "unassigned" ? null : value
                              )
                            }
                          >
                            <SelectTrigger className="w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">-</SelectItem>
                              {tables.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  T{t.table_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Unassigned Guests */}
        {getUnassignedGuests().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-autumn-burgundy">Ospiti Non Assegnati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getUnassignedGuests().map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {guest.type === 'invited' ? 'Invitato' : 'Accompagnatore'}
                        </Badge>
                        {guest.rsvp_attending === true && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Confermato
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Select
                      value="unassigned"
                      onValueChange={(value) => 
                        assignGuestToTable(guest.id, guest.type, value === "unassigned" ? null : value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Assegna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non Assegnato</SelectItem>
                        {tables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            Tavolo {table.table_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TableManagement;