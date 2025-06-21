
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift } from 'lucide-react';

const GiftRegistry = () => {
  return (
    <div className="section-container bg-autumn-cream bg-opacity-10" id="lista-nozze">
      <h2 className="section-title">Lista Nozze</h2>
      
      <div className="text-center">
        <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
          Il regalo più grande è la vostra presenza al nostro matrimonio. Per chi volesse fare un pensiero, 
          abbiamo creato alcune liste presso i nostri negozi preferiti.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="autumn-card">
            <CardHeader className="text-center">
              <Gift className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
              <CardTitle className="text-xl font-playfair text-autumn-burgundy">
                Lista Casa
              </CardTitle>
              <CardDescription>
                Tutto per la nostra nuova casa insieme
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="autumn-button" asChild>
                <a href="https://www.example.com/lista-casa" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visualizza Lista
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="autumn-card">
            <CardHeader className="text-center">
              <Gift className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
              <CardTitle className="text-xl font-playfair text-autumn-burgundy">
                Viaggio di Nozze
              </CardTitle>
              <CardDescription>
                Contributi per la nostra luna di miele
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="autumn-button" asChild>
                <a href="https://www.example.com/viaggio-nozze" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contribuisci
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-gray-600 mt-8 italic">
          "L'importante non è il regalo, ma il gesto d'amore che lo accompagna."
        </p>
      </div>
    </div>
  );
};

export default GiftRegistry;
