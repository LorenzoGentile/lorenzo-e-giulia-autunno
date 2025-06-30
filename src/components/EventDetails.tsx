import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';

const EventDetails = () => {
  return (
    <div className="section-container bg-autumn-cream bg-opacity-20" id="dettagli">
      <h2 className="section-title">Dettagli dell'Evento</h2>
      
      <div className="text-center mb-12">
        <div className="inline-flex items-center mb-4">
          <Calendar className="w-6 h-6 text-autumn-terracotta mr-2" />
          <span className="text-2xl font-playfair text-autumn-burgundy">19 Ottobre 2025</span>
        </div>
        <p className="text-lg text-gray-700">Vi invitiamo a celebrare il nostro matrimonio</p>
      </div>
      
      <div className="autumn-card max-w-3xl mx-auto text-center p-8">
        <MapPin className="w-10 h-10 text-autumn-terracotta mb-4 mx-auto" />
        <h3 className="text-3xl font-playfair text-autumn-burgundy mb-2">Villa del Cardinale</h3>
        <p className="text-lg text-gray-600 mb-6">Via dei Laghi 7, Km 11, 00040 Rocca di Papa RM</p>

        <div className="flex justify-center divide-x-2 divide-autumn-gold my-6">
          <div className="px-8 text-center">
            <h4 className="text-2xl font-playfair text-autumn-burgundy mb-2">La Cerimonia</h4>
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 text-autumn-terracotta mr-2" />
              <span className="text-xl">12:00</span>
            </div>
          </div>
          <div className="px-8 text-center">
            <h4 className="text-2xl font-playfair text-autumn-burgundy mb-2">Il Ricevimento</h4>
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 text-autumn-terracotta mr-2" />
            <span className="text-xl">14:00</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mt-6 text-lg">
          La cerimonia e il ricevimento si terranno entrambi nella splendida cornice di Villa del Cardinale, 
          un luogo incantevole che abbiamo scelto per condividere con voi questo giorno speciale.
        </p>
      </div>

      <div className="mt-12 text-center">
        <h3 className="section-subtitle">Come Arrivare</h3>
        <div className="aspect-w-16 aspect-h-9 mt-6">
          <iframe 
            title="Wedding Location Map"
            className="w-full h-64 rounded-lg shadow-md"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2976.850274525637!2d12.689743476273291!3d41.745322273716674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1325842cc3471461%3A0x65f6ee5e5210a1f5!2sVilla%20del%20Cardinale!5e0!3m2!1sen!2sit!4v1749109190719!5m2!1sen!2sit"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;