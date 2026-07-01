import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "byop_practice_timer";

function loadPersisted(sectionKey) {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}_${sectionKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function persist(sectionKey, state) {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}_${sectionKey}`, JSON.stringify(state));
  } catch {}
}

function clearPersist(sectionKey) {
  try {
    sessionStorage.removeItem(`${STORAGE_KEY}_${sectionKey}`);
  } catch {}
}

export default function Timer({
  mode = "elapsed",       // "countdown" | "elapsed"
  totalSeconds = 1200,    // only used for countdown
  sectionKey,
  onExpire,
  running = true,
}) {
  const getInitial = () => {
    const persisted = mode === "countdown" ? loadPersisted(sectionKey) : null;
    if (persisted && persisted.remaining > 0) return persisted.remaining;
    return mode === "countdown" ? totalSeconds : 0;
  };

  const [remaining, setRemaining] = useState(getInitial);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (mode === "countdown") {
        const next = Math.max(0, prev - 1);
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpire?.(), 0);
          clearPersist(sectionKey);
        } else if (next > 0) {
          persist(sectionKey, { remaining: next });
        }
        return next;
      } else {
        return prev + 1;
      }
    });
  }, [mode, onExpire, sectionKey]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  useEffect(() => {
    if (mode === "countdown") {
      expiredRef.current = false;
      const p = loadPersisted(sectionKey);
      setRemaining(p?.remaining ?? totalSeconds);
    } else {
      setRemaining(0);
    }
  }, [mode, totalSeconds, sectionKey]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  // Color coding for countdown
  let colorClass = "text-gray-700 dark:text-gray-300";
  if (mode === "countdown") {
    const pct = remaining / totalSeconds;
    if (pct < 0.1) colorClass = "text-red-500 animate-pulse";
    else if (pct < 0.2) colorClass = "text-amber-500";
    else if (pct < 0.5) colorClass = "text-yellow-500";
  }

  return (
    <span className={`font-mono font-bold text-sm tabular-nums ${colorClass}`}>
      {formatted}
    </span>
  );
}
