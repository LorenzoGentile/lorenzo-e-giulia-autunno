import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Calendar, MessageSquare, Shield, Image, UserPlus, Mail, ClipboardList, BarChart3, UserCheck, Camera, User } from 'lucide-react';
import RsvpManagement from '@/components/admin/RsvpManagement';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminStats {
  totalGuests: number;
  totalRsvps: number;
  attendingGuests: number;
  notAttendingGuests: number;
  totalPhotos: number;
  totalAdditionalGuests: number;
  totalAttendees: number; // invited guests + additional guests who are attending
}

interface GuestData {
  id: string;
  name: string;
  email: string;
  attending?: boolean;
  dietary_restrictions?: string;
  message?: string;
  created_at?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking admin access for user:', user.id);
      
      // Check if user has admin role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        const hasAdminRole = !!data;
        console.log('Has admin role:', hasAdminRole);
        setIsAdmin(hasAdminRole);
        
        if (hasAdminRole) {
          await loadAdminData();
        }
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      console.log('Loading admin data...');
      
      // Load statistics including additional guests
      const [guestsResult, rsvpsResult, photosResult, additionalGuestsResult] = await Promise.all([
        supabase.from('invited_guests').select('*'),
        supabase.from('rsvp_responses').select('*'),
        supabase.from('wedding_photos').select('id'),
        supabase.from('additional_guests').select('*')
      ]);

      if (guestsResult.error) {
        console.error('Error loading guests:', guestsResult.error);
        throw guestsResult.error;
      }
      if (rsvpsResult.error) {
        console.error('Error loading RSVPs:', rsvpsResult.error);
        throw rsvpsResult.error;
      }
      if (photosResult.error) {
        console.error('Error loading photos:', photosResult.error);
        throw photosResult.error;
      }
      if (additionalGuestsResult.error) {
        console.error('Error loading additional guests:', additionalGuestsResult.error);
        throw additionalGuestsResult.error;
      }

      const totalGuests = guestsResult.data?.length || 0;
      const totalRsvps = rsvpsResult.data?.length || 0;
      const attendingGuests = rsvpsResult.data?.filter(r => r.attending).length || 0;
      const notAttendingGuests = rsvpsResult.data?.filter(r => !r.attending).length || 0;
      const totalPhotos = photosResult.data?.length || 0;
      
      // Calculate additional guest statistics
      const attendingRsvpIds = rsvpsResult.data?.filter(r => r.attending).map(r => r.id) || [];
      const totalAdditionalGuests = additionalGuestsResult.data?.filter(ag => 
        attendingRsvpIds.includes(ag.rsvp_id)
      ).length || 0;
      const totalAttendees = attendingGuests + totalAdditionalGuests;

      console.log('Admin stats:', { 
        totalGuests, 
        totalRsvps, 
        attendingGuests, 
        notAttendingGuests, 
        totalPhotos, 
        totalAdditionalGuests, 
        totalAttendees 
      });

      setStats({
        totalGuests,
        totalRsvps,
        attendingGuests,
        notAttendingGuests,
        totalPhotos,
        totalAdditionalGuests,
        totalAttendees
      });

      // Combine guest and RSVP data
      const guestData: GuestData[] = guestsResult.data?.map(guest => {
        const rsvp = rsvpsResult.data?.find(r => r.guest_id === guest.id);
        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          attending: rsvp?.attending,
          dietary_restrictions: rsvp?.dietary_restrictions,
          message: rsvp?.message,
          created_at: rsvp?.created_at
        };
      }) || [];

      setGuests(guestData);
      console.log('Loaded guest data:', guestData.length, 'guests');
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Admin: Initiating logout...');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Admin logout error:', error);
      // Navigate anyway since local state should be cleared
      navigate('/');
    }
  };

  const addNewGuest = async () => {
    if (!newGuestEmail || !newGuestName) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    setIsAddingGuest(true);
    try {
      const { error } = await supabase
        .from('invited_guests')
        .insert({
          name: newGuestName,
          email: newGuestEmail.toLowerCase(),
          invite_code: Math.random().toString(36).substring(2, 15)
        });

      if (error) throw error;

      toast({
        title: "Guest added",
        description: `${newGuestName} has been added to the guest list`,
      });

      setNewGuestName('');
      setNewGuestEmail('');
      await loadAdminData(); // Refresh the data
    } catch (error: any) {
      console.error('Error adding guest:', error);
      toast({
        title: "Error adding guest",
        description: error.message || "Failed to add guest",
        variant: "destructive",
      });
    } finally {
      setIsAddingGuest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-autumn-amber" />
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Access Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please log in to access the admin panel
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full autumn-button"
            >
              Log In
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              You don't have admin permissions to access this page
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Log Out
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="w-full autumn-button"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex justify-between items-center'} py-6`}>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>Wedding Admin Panel</h1>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Manage your wedding website and guest responses</p>
            </div>
            <div className={`flex items-center ${isMobile ? 'justify-between' : 'space-x-4'}`}>
              <span className="text-sm text-gray-600">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                size={isMobile ? 'sm' : 'default'}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} ${isMobile ? 'gap-1' : ''}`}>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {isMobile ? 'Stats' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {isMobile ? 'Guests' : 'Guest Management'}
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              {isMobile ? 'RSVPs' : 'RSVP Management'}
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {isMobile ? 'Photos' : 'Photo Management'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'}`}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invited Guests</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalGuests}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">RSVP Responses</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRsvps}</div>
                    <p className="text-xs text-muted-foreground">
                      of {stats.totalGuests} invited
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attending Guests</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.attendingGuests}</div>
                    <p className="text-xs text-muted-foreground">invited guests</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Additional Guests</CardTitle>
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalAdditionalGuests}</div>
                    <p className="text-xs text-muted-foreground">plus ones & family</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{stats.totalAttendees}</div>
                    <p className="text-xs text-muted-foreground">
                      guests + additional
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Not Attending</CardTitle>
                    <Calendar className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.notAttendingGuests}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Photos</CardTitle>
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => navigate('/tables')}
                    className="w-full autumn-button flex items-center gap-2"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Gestione Tavoli
                  </Button>
                  <Button 
                    onClick={() => navigate('/photos')}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Galleria Foto
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Response Rate</span>
                        <span>{stats.totalGuests > 0 ? Math.round((stats.totalRsvps / stats.totalGuests) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-autumn-amber h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: stats.totalGuests > 0 ? `${(stats.totalRsvps / stats.totalGuests) * 100}%` : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Guest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${isMobile ? 'space-y-4' : 'flex gap-4 items-end'}`}>
                  <div className={isMobile ? 'w-full' : 'flex-1'}>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      placeholder="Guest name"
                    />
                  </div>
                  <div className={isMobile ? 'w-full' : 'flex-1'}>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                    />
                  </div>
                  <Button 
                    onClick={addNewGuest}
                    disabled={isAddingGuest}
                    className={`autumn-button ${isMobile ? 'w-full' : ''}`}
                  >
                    {isAddingGuest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Add Guest
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest List & RSVP Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // Mobile card layout
                  <div className="space-y-4">
                    {guests.map(guest => (
                      <Card key={guest.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{guest.name}</h4>
                              <p className="text-sm text-muted-foreground">{guest.email}</p>
                            </div>
                            <div className="text-right">
                              {guest.attending === undefined ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No response</span>
                              ) : guest.attending ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">Attending</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Not attending</span>
                              )}
                            </div>
                          </div>
                          {(guest.dietary_restrictions || guest.message) && (
                            <div className="pt-2 border-t border-gray-100">
                              {guest.dietary_restrictions && (
                                <p className="text-sm"><span className="font-medium">Dietary:</span> {guest.dietary_restrictions}</p>
                              )}
                              {guest.message && (
                                <p className="text-sm"><span className="font-medium">Message:</span> {guest.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop table layout
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>RSVP Status</TableHead>
                          <TableHead>Dietary Restrictions</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guests.map(guest => (
                          <TableRow key={guest.id}>
                            <TableCell className="font-medium">{guest.name}</TableCell>
                            <TableCell>{guest.email}</TableCell>
                            <TableCell>
                              {guest.attending === undefined ? (
                                <span className="text-gray-500">No response</span>
                              ) : guest.attending ? (
                                <span className="text-green-600 font-medium">Attending</span>
                              ) : (
                                <span className="text-red-600 font-medium">Not attending</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {guest.dietary_restrictions || '-'}
                            </TableCell>
                            <TableCell>
                              {guest.message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rsvp" className="space-y-6">
            <RsvpManagement />
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Photo Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Photo management features will be implemented here. 
                  Currently showing {stats?.totalPhotos || 0} uploaded photos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
