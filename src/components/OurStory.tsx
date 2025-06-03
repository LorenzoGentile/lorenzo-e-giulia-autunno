
import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const OurStory = () => {
  const timelineEvents = [
    {
      date: 'Settembre 2018',
      title: 'Il primo incontro',
      description: 'Ci siamo incontrati ad una festa di amici comuni. Lorenzo ha notato Giulia mentre rideva con le sue amiche e ha deciso di presentarsi.'
    },
    {
      date: 'Dicembre 2018',
      title: 'Il primo appuntamento',
      description: 'Dopo settimane di messaggi, Lorenzo ha finalmente invitato Giulia a cena in un piccolo ristorante nel centro storico.'
    },
    {
      date: 'Luglio 2019',
      title: 'La prima vacanza insieme',
      description: 'Abbiamo trascorso due settimane indimenticabili esplorando la Sicilia e le sue meravigliose spiagge.'
    },
    {
      date: 'Marzo 2021',
      title: 'La convivenza',
      description: 'Abbiamo deciso di andare a vivere insieme nel nostro piccolo appartamento con vista sulle colline toscane.'
    },
    {
      date: 'Ottobre 2024',
      title: 'La proposta',
      description: 'Durante una passeggiata autunnale tra i vigneti, Lorenzo si è inginocchiato e mi ha chiesto di sposarlo.'
    }
  ];

  const timelineRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );
    
    const timelineItems = document.querySelectorAll('.timeline-item-animate');
    timelineItems.forEach((item) => observer.observe(item));
    
    return () => {
      timelineItems.forEach((item) => observer.unobserve(item));
    };
  }, []);
  
  return (
    <div className="section-container" id="storia">
      <h2 className="section-title">La Nostra Storia</h2>
      <div className="relative" ref={timelineRef}>
        {!isMobile && (
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-autumn-amber opacity-50" />
        )}
        
        {timelineEvents.map((event, index) => (
          <div 
            key={index} 
            className={`mb-12 ${isMobile ? 'flex-col' : `flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`} relative timeline-item-animate flex`}
            style={{transitionDelay: `${index * 0.2}s`}}
          >
            <div className={`${isMobile ? 'w-full' : 'w-1/2'} ${!isMobile && (index % 2 === 0 ? 'pr-8 text-right' : 'pl-8')}`}>
              <div className="autumn-card">
                <h3 className="text-autumn-terracotta font-playfair text-xl font-semibold">{event.title}</h3>
                <p className="text-autumn-burgundy font-bold text-sm mb-2">{event.date}</p>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>
            
            {!isMobile && (
              <>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-autumn-terracotta border-4 border-autumn-amber flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-autumn-amber" />
                </div>
                <div className="w-1/2" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurStory;
