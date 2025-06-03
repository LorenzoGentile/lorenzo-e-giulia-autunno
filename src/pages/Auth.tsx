
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-autumn-cream bg-opacity-10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-playfair text-autumn-burgundy">
            Lorenzo & Giulia
          </h1>
          <p className="text-autumn-terracotta mt-2">
            Area Riservata agli Invitati
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Accedi</CardTitle>
            <CardDescription className="text-center">
              Accedi o registrati per gestire il tuo RSVP e caricare foto
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="signup">Registrati</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  onSuccess={handleLoginSuccess}
                />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignupForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Torna alla Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
