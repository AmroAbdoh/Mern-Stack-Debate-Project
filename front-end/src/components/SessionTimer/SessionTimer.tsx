import { useEffect, useState } from "react";
import "./session-timer.css";

interface SessionTimerProps {
  endsAt?: string;
  label?: string;
}

function SessionTimer({ endsAt, label = "Time remaining" }: SessionTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      setRemaining(
        endsAt
          ? Math.max(
              0,
              Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000),
            )
          : 0,
      );
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="session-timer" aria-live="polite">
      <span>{label}</span>
      <strong>
        {minutes}:{seconds}
      </strong>
    </div>
  );
}

export default SessionTimer;
