
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Calendar, MessageSquare, Shield } from 'lucide-react';

interface AdminStats {
  totalGuests: number;
  totalRsvps: number;
  attendingGuests: number;
  notAttendingGuests: number;
  totalPhotos: number;
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

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
      // Load statistics
      const [guestsResult, rsvpsResult, photosResult] = await Promise.all([
        supabase.from('invited_guests').select('*'),
        supabase.from('rsvp_responses').select('*'),
        supabase.from('wedding_photos').select('id')
      ]);

      if (guestsResult.error) throw guestsResult.error;
      if (rsvpsResult.error) throw rsvpsResult.error;
      if (photosResult.error) throw photosResult.error;

      const totalGuests = guestsResult.data?.length || 0;
      const totalRsvps = rsvpsResult.data?.length || 0;
      const attendingGuests = rsvpsResult.data?.filter(r => r.attending).length || 0;
      const notAttendingGuests = rsvpsResult.data?.filter(r => !r.attending).length || 0;
      const totalPhotos = photosResult.data?.length || 0;

      setStats({
        totalGuests,
        totalRsvps,
        attendingGuests,
        notAttendingGuests,
        totalPhotos
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
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Admin Panel</h1>
              <p className="text-gray-600">Manage your wedding website and guest responses</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guests">Guest Management</TabsTrigger>
            <TabsTrigger value="photos">Photo Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
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
                    <CardTitle className="text-sm font-medium">Attending</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.attendingGuests}</div>
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
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Recent RSVPs and photo uploads will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest List & RSVP Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">RSVP Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Dietary Restrictions</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map(guest => (
                        <tr key={guest.id}>
                          <td className="border border-gray-300 px-4 py-2">{guest.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{guest.email}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {guest.attending === undefined ? (
                              <span className="text-gray-500">No response</span>
                            ) : guest.attending ? (
                              <span className="text-green-600 font-medium">Attending</span>
                            ) : (
                              <span className="text-red-600 font-medium">Not attending</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {guest.dietary_restrictions || '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {guest.message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
