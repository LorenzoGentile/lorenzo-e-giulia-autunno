
import React, { useState, useEffect } from 'react';

const CountdownTimer = () => {
  // Wedding date - Set to October 19, 2025
  const weddingDate = new Date(2025, 9, 19, 12, 0, 0).getTime();
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;
      
      if (distance < 0) {
        clearInterval(timer);
        // If wedding date has passed
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [weddingDate]);

  const timeUnits = [
    { label: 'Giorni', value: timeLeft.days },
    { label: 'Ore', value: timeLeft.hours },
    { label: 'Minuti', value: timeLeft.minutes },
    { label: 'Secondi', value: timeLeft.seconds }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-playfair text-autumn-burgundy text-center mb-8">
        Ci Sposeremo
      </h2>
      <div className="flex justify-center mb-8">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {timeUnits.map((unit) => (
            <div 
              key={unit.label} 
              className="flex flex-col items-center autumn-card min-w-[100px]"
            >
              <span className="text-4xl md:text-5xl font-bold text-autumn-terracotta">
                {unit.value < 10 ? `0${unit.value}` : unit.value}
              </span>
              <span className="text-sm text-autumn-burgundy font-medium">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-xl font-playfair text-autumn-burgundy">
        19 Ottobre 2025 • Villa del Cardinale • Rocca di Papa
      </p>
    </div>
  );
};

export default CountdownTimer;
