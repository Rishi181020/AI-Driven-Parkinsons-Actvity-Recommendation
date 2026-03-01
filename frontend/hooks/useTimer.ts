import { useState, useEffect } from "react";

export function useTimer(initialSeconds: number) {
  const [timer, setTimer] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running || timer === 0) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, timer]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => { setTimer(initialSeconds); setRunning(false); setFinished(false); };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { timer, running, finished, start, pause, reset, fmt };
}
