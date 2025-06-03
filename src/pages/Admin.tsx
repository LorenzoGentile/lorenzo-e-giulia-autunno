
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { toast } = useToast();
  const [password, setPassword] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we'll use a simple password check. We'll update this with Supabase auth
    if (password === 'wedding2025') {
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Invalid password",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Access
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wedding Admin Panel</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Guest Management</h2>
          <p className="text-gray-600">
            Coming soon: Guest list management and RSVP tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
