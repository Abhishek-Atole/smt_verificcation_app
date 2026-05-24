import { useEffect, useState } from 'react';

export function useClock() {
  const [timeString, setTimeString] = useState(() => new Date().toLocaleTimeString([], { hour12: false }));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeString(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return timeString;
}
