'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  endTime: string;
}

export default function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isEnded: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  useEffect(() => {
    function calculateTime() {
      const difference = new Date(endTime).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isEnded: false });
    }

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.isEnded) {
    return <span className="font-bold text-rose-600 text-sm">Auction Ended</span>;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="font-mono font-black text-amber-900 text-base tracking-wider">
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}
