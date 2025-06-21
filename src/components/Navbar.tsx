
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Users } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isInvitedGuest, signOut } = useAuth();
  
  // Handle navbar background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'La Nostra Storia', href: '/#storia' },
    { name: 'Dettagli Evento', href: '/#dettagli' },
    { name: 'RSVP', href: user && isInvitedGuest ? '/members' : '/auth' },
    { name: 'Galleria', href: '/#galleria' },
    { name: 'Foto', href: '/photos' },
    { name: 'Lista Nozze', href: '/#lista-nozze' },
  ];
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="font-playfair text-xl font-bold text-autumn-burgundy">
            L&G
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map(link => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-autumn-burgundy hover:text-autumn-terracotta transition-colors font-montserrat"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* User authentication */}
          <div className="hidden md:flex items-center space-x-3">
            {user && isInvitedGuest ? (
              <>
                <Link to="/members">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Area Riservata
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-autumn-burgundy font-medium">
                    <User className="inline-block mr-1 w-4 h-4" />
                    {user.email?.split('@')[0]}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                  >
                    Esci
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="border-autumn-terracotta text-autumn-terracotta hover:bg-autumn-terracotta hover:text-white"
                >
                  Accedi
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden focus:outline-none"
                aria-label="Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-autumn-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map(link => (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="text-lg text-autumn-burgundy hover:text-autumn-terracotta transition-colors font-montserrat"
                  >
                    {link.name}
                  </a>
                ))}
                
                <div className="pt-4 border-t border-gray-200">
                  {user && isInvitedGuest ? (
                    <div className="space-y-3">
                      <Link to="/members" className="block">
                        <Button className="w-full autumn-button mb-3">
                          <Users className="w-4 h-4 mr-2" />
                          Area Riservata
                        </Button>
                      </Link>
                      <div className="flex items-center mb-3">
                        <User className="w-5 h-5 mr-2 text-autumn-burgundy" />
                        <span className="text-autumn-burgundy font-medium">
                          {user.email?.split('@')[0]}
                        </span>
                      </div>
                      <Button 
                        onClick={handleLogout}
                        className="w-full autumn-button"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button className="w-full autumn-button">
                        Accedi
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
