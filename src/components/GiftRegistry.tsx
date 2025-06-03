
import React from 'react';
import { Gift } from 'lucide-react';

const GiftRegistry = () => {
  return (
    <div className="section-container bg-autumn-cream bg-opacity-20" id="regalo">
      <h2 className="section-title">Lista Nozze</h2>
      
      <div className="max-w-3xl mx-auto text-center">
        <div className="autumn-card mb-8">
          <Gift className="w-12 h-12 text-autumn-terracotta mx-auto mb-4" />
          
          <h3 className="text-2xl font-playfair text-autumn-burgundy mb-4">
            Il vostro affetto è il regalo più grande
          </h3>
          
          <p className="text-gray-700 mb-6">
            La vostra presenza al nostro matrimonio è il dono più prezioso. Se desiderate comunque farci un regalo, vi saremmo grati se voleste contribuire al nostro viaggio di nozze in Giappone.
          </p>
          
          <div className="flex flex-col items-center">
            <h4 className="text-xl font-playfair text-autumn-terracotta mb-2">
              Coordinate Bancarie
            </h4>
            <div className="bg-autumn-amber bg-opacity-20 rounded-lg p-4 max-w-md">
              <p className="mb-1"><span className="font-semibold">Intestatario:</span> Lorenzo Rossi e Giulia Bianchi</p>
              <p className="mb-1"><span className="font-semibold">IBAN:</span> IT12A0123456789000000123456</p>
              <p><span className="font-semibold">Causale:</span> Regalo Matrimonio Lorenzo e Giulia</p>
            </div>
          </div>
        </div>
        
        <div className="autumn-card">
          <h3 className="text-2xl font-playfair text-autumn-burgundy mb-4">
            Lista Nozze Tradizionale
          </h3>
          
          <p className="text-gray-700 mb-6">
            Abbiamo anche creato una lista nozze presso "Casa Bella" a Firenze. Potete visitare il negozio e contribuire alla nostra lista nozze numero #LG2025.
          </p>
          
          <div className="border-t border-autumn-amber border-opacity-30 pt-4">
            <p className="text-gray-600 italic">
              "Non è tanto il dono, ma il pensiero che conta"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftRegistry;
