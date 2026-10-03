import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm-200/80 border border-warm-300 text-ink-700 text-xs font-medium tracking-tight shadow-sm">
      <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
      <span>Next poll in:</span>
      <span className="font-mono font-bold text-ink-900 tracking-wider">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
      <span className="text-[10px] text-ink-500 font-normal hidden sm:inline">(12:00 AM IST)</span>
    </div>
  );
};
