
import React from 'react';
import { Calendar, MapPin, Clock, Heart } from 'lucide-react';

const EventDetails = () => {
  const events = [
    {
      title: 'La Cerimonia',
      time: '16:00',
      location: 'Chiesa di San Lorenzo',
      address: 'Via dei Medici, 15, Firenze',
      icon: Heart,
      description: 'La cerimonia si svolgerà nella storica Chiesa di San Lorenzo, nel cuore di Firenze.'
    },
    {
      title: 'Il Ricevimento',
      time: '18:00',
      location: 'Villa Toscana',
      address: 'Via delle Colline, 42, Fiesole',
      icon: MapPin,
      description: 'Il ricevimento sarà ospitato nella magnifica Villa Toscana, con vista panoramica su Firenze.'
    }
  ];

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map((event, index) => (
          <div key={index} className="autumn-card flex flex-col items-center text-center">
            <event.icon className="w-10 h-10 text-autumn-terracotta mb-4" />
            <h3 className="text-2xl font-playfair text-autumn-burgundy mb-2">{event.title}</h3>
            
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-autumn-terracotta mr-2" />
              <span className="text-lg">{event.time}</span>
            </div>
            
            <h4 className="text-xl font-semibold mb-1">{event.location}</h4>
            <p className="text-gray-600 mb-4">{event.address}</p>
            
            <p className="text-gray-700">{event.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h3 className="section-subtitle">Come Arrivare</h3>
        <div className="aspect-w-16 aspect-h-9 mt-6">
          <iframe 
            title="Wedding Location Map"
            className="w-full h-64 rounded-lg shadow-md"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11521.261088229017!2d11.2542248871582!3d43.7687131!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132a56a680d2d6ad%3A0x93d57917efc72a03!2sBasilica%20di%20San%20Lorenzo!5e0!3m2!1sen!2sit!4v1663598084347!5m2!1sen!2sit"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
