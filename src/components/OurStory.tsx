import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const OurStory = () => {
  const timelineEvents = [
    {
      date: '14 Giugno 2012',
      title: 'Il primo incontro',
      description: 'Ci siamo incontrati in occasione della partita degli Europei Italia-Croazia a Piazza Vittorio. Finalemnte Giulia dopo aver tanto sentito parlare di lui, conosce "il Romano".'
    },
    {
      date: '26 Settembre 2014',
      title: 'Il primo appuntamento',
      description: 'Dopo più di due anni di amicizia, Lorenzo ha finalmente invitato Giulia a cena in un piccolo ristorante nel centro storico di Torino.'
    },
    {
      date: 'Giugno 2015',
      title: 'La prima vacanza insieme',
      description: 'Abbiamo trascorso due settimane indimenticabili in Calabria, scoprendo le sue spiagge cristalline e i suoi borghi incantevoli. Da allora, ogni anno torniamo in questa terra meravigliosa per trascorrere splendide vacanze insieme.'
    },
    {
      date: 'Giugno 2018',
      title: 'La convivenza',
      description: 'Giulia raggiunge Lorenzo a Gummersbach dove iniziano una lunga convivenza. Dopo essere passati per Colonia, ora continuano la loro vita insieme a Roma.'
    },
    {
      date: 'Novembre 2024',
      title: 'La proposta',
      description: 'Lorenzo ha fatto la proposta a Giulia a St. James\'s Park a Londra, città che Giulia ama tanto. Anche i famosi scoiattoli del parco sono stati protagonisti di questo momento magico e indimenticabile.'
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
    
    const timelineItems = document.querySelectorAll('.timeline-item-animate');-
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
