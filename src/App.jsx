import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

const TIMERS = {
  focus: { label: "Focus",       duration: 25 * 60 * 1000, display: "25:00" },
  short: { label: "Short Break", duration:  5 * 60 * 1000, display:  "5:00" },
  long:  { label: "Long Break",  duration: 10 * 60 * 1000, display: "10:00" },
};

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function playAlarm() {
  const audio = new Audio("/8footdino_on_scratch-alarm-301729.mp3");
  audio.play();
}

export default function App() {
  const [activeTab,   setActiveTab]   = useState(null);
  const [timeDisplay, setTimeDisplay] = useState("25:00");
  const [btnState,    setBtnState]    = useState("Start");
  const [stopLabel,   setStopLabel]   = useState("Stop");
  const [showMsg,     setShowMsg]     = useState(false);

  const intervalRef  = useRef(null);
  const remainingRef = useRef(null);

  const clearTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const onEnd = useCallback(() => {
    clearTimer();
    setTimeDisplay("0:00");
    playAlarm();
    setBtnState("Start");
    setStopLabel("Stop");
    remainingRef.current = null;
  }, []);

  const startCountdown = useCallback((ms) => {
    clearTimer();
    const end = Date.now() + ms;
    remainingRef.current = ms;
    intervalRef.current = setInterval(() => {
      const left = end - Date.now();
      left <= 0 ? onEnd() : (remainingRef.current = left, setTimeDisplay(formatTime(left)));
    }, 1000);
  }, [onEnd]);

  const resumeCountdown = useCallback(() => {
    if (!remainingRef.current) return;
    const end = Date.now() + remainingRef.current;
    intervalRef.current = setInterval(() => {
      const left = end - Date.now();
      left <= 0 ? onEnd() : (remainingRef.current = left, setTimeDisplay(formatTime(left)));
    }, 1000);
  }, [onEnd]);

  const handleTab = (key) => {
    clearTimer();
    setActiveTab(key);
    setTimeDisplay(TIMERS[key].display);
    setBtnState("Start");
    setStopLabel("Stop");
    setShowMsg(false);
    remainingRef.current = null;
  };

  const handleStart = () => {
    if (!activeTab) { setShowMsg(true); return; }
    setShowMsg(false);
    if (btnState === "Start") {
      startCountdown(TIMERS[activeTab].duration);
      setBtnState("Pause");
      setStopLabel("Reset");
    } else if (btnState === "Pause") {
      clearTimer();
      setBtnState("Resume");
    } else {
      resumeCountdown();
      setBtnState("Pause");
    }
  };

  const handleStop = () => {
    if (!activeTab) return;
    clearTimer();
    setTimeDisplay(TIMERS[activeTab].display);
    setBtnState("Start");
    setStopLabel("Stop");
    remainingRef.current = null;
  };

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="app">
      <div className="card">
        <h1>Pomodoro Timer</h1>

        <div className="tabs">
          {Object.entries(TIMERS).map(([key, { label }]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => handleTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {showMsg && <p className="msg">Please select a timer first.</p>}

        <div className="display">
          <span className="time">{timeDisplay}</span>
          {activeTab && <span className="mode">{TIMERS[activeTab].label}</span>}
        </div>

        <div className="controls">
          <button className="btn-primary" onClick={handleStart}>{btnState}</button>
          <button className="btn-secondary" onClick={handleStop}>{stopLabel}</button>
        </div>
      </div>
    </div>
  );
}
