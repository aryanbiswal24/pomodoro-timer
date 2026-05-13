import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const TIMERS = {
  focus: { label: "Focus", duration: 25 * 60 * 1000, display: "25:00" },
  short: { label: "Short Break", duration: 5 * 60 * 1000, display: "5:00" },
  long:  { label: "Long Break",  duration: 10 * 60 * 1000, display: "10:00" },
};

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.25);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.25);
    });
  } catch (e) {
    console.warn("Audio unavailable:", e);
  }
}

export default function App() {
  const [activeTab, setActiveTab]     = useState(null);
  const [timeDisplay, setTimeDisplay] = useState(TIMERS.focus.display);
  const [btnState, setBtnState]       = useState("Start");
  const [stopLabel, setStopLabel]     = useState("Stop");
  const [showMsg, setShowMsg]         = useState(false);
  const [pulse, setPulse]             = useState(false);

  const intervalRef   = useRef(null);
  const remainingRef  = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const onTimerEnd = useCallback(() => {
    clearTimer();
    setTimeDisplay("0:00");
    playAlarm();
    setBtnState("Start");
    setStopLabel("Stop");
    remainingRef.current = null;
    setPulse(false);
  }, []);

  const startCountdown = useCallback((durationMs) => {
    clearTimer();
    const end = Date.now() + durationMs;
    remainingRef.current = durationMs;

    intervalRef.current = setInterval(() => {
      const left = end - Date.now();
      if (left <= 0) {
        onTimerEnd();
      } else {
        remainingRef.current = left;
        setTimeDisplay(formatTime(left));
      }
    }, 1000);
  }, [onTimerEnd]);

  const resumeCountdown = useCallback(() => {
    if (!remainingRef.current) return;
    const end = Date.now() + remainingRef.current;

    intervalRef.current = setInterval(() => {
      const left = end - Date.now();
      if (left <= 0) {
        onTimerEnd();
      } else {
        remainingRef.current = left;
        setTimeDisplay(formatTime(left));
      }
    }, 1000);
  }, [onTimerEnd]);

  const handleTabClick = (key) => {
    clearTimer();
    setActiveTab(key);
    setTimeDisplay(TIMERS[key].display);
    setBtnState("Start");
    setStopLabel("Stop");
    remainingRef.current = null;
    setShowMsg(false);
    setPulse(false);
  };

  const handleStart = () => {
    if (!activeTab) { setShowMsg(true); return; }
    setShowMsg(false);

    if (btnState === "Start") {
      startCountdown(TIMERS[activeTab].duration);
      setBtnState("Pause");
      setStopLabel("Reset");
      setPulse(true);
    } else if (btnState === "Pause") {
      clearTimer();
      setBtnState("Resume");
      setPulse(false);
    } else {
      resumeCountdown();
      setBtnState("Pause");
      setPulse(true);
    }
  };

  const handleStop = () => {
    if (!activeTab) return;
    clearTimer();
    setTimeDisplay(TIMERS[activeTab].display);
    setBtnState("Start");
    setStopLabel("Stop");
    remainingRef.current = null;
    setPulse(false);
  };

  useEffect(() => () => clearTimer(), []);

  const isRunning = btnState === "Pause";

  return (
    <div className="app">
      <div className="bg-glow" />

      {showMsg && (
        <div className="timer-message">
          <span className="msg-icon">⚠</span>
          please select a timer before starting
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="logo-mark" />
          <h1 className="title">Pomodoro Timer</h1>
        </div>

        <div className="tab-row">
          {Object.entries(TIMERS).map(([key, { label }]) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => handleTabClick(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={`display-wrap ${pulse ? "running" : ""}`}>
          <svg className="ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" className="ring-track" />
            <circle
              cx="100" cy="100" r="88"
              className={`ring-fill ${isRunning ? "ring-animate" : ""}`}
              style={{ "--duration": activeTab ? TIMERS[activeTab].duration / 1000 : 1500 }}
            />
          </svg>
          <span className="time-text">{timeDisplay}</span>
          {activeTab && (
            <span className="mode-label">{TIMERS[activeTab].label}</span>
          )}
        </div>

        <div className="ctrl-row">
          <button className="btn-start" onClick={handleStart}>
            {btnState}
          </button>
          <button className="btn-stop" onClick={handleStop}>
            {stopLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
