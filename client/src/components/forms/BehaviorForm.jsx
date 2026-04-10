// ============================================================
// Rakshak AI — Behavior Capture (Auto Tracking)
// Tracks typing speed, session duration, time of activity
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Keyboard, Timer, Zap, BarChart3 } from 'lucide-react';

export default function BehaviorForm({ data, onChange, disabled }) {
  const [typingTest, setTypingTest] = useState('');
  const [keystrokeTimestamps, setKeystrokeTimestamps] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const intervalRef = useRef(null);

  // Session duration tracker
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const dur = Math.floor((Date.now() - sessionStart) / 1000);
      setSessionDuration(dur);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [sessionStart]);

  // Update parent data when metrics change
  useEffect(() => {
    const now = new Date();
    onChange({
      ...data,
      typing_speed_avg: currentSpeed || data.typing_speed_avg || 0,
      session_duration_avg: sessionDuration,
      time_of_activity: now.toISOString(),
      active_hours: {
        start: now.getHours(),
        end: Math.min(23, now.getHours() + 2),
      },
    });
  }, [currentSpeed, sessionDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing speed measurement
  const handleTyping = useCallback((e) => {
    const value = e.target.value;
    setTypingTest(value);

    const now = Date.now();
    setKeystrokeTimestamps(prev => {
      const updated = [...prev, now].slice(-20); // Keep last 20 keystrokes
      if (updated.length >= 3) {
        const intervals = [];
        for (let i = 1; i < updated.length; i++) {
          intervals.push(updated[i] - updated[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const cps = 1000 / avgMs; // chars per second
        setCurrentSpeed(Math.round(cps * 10) / 10);
      }
      return updated;
    });
  }, []);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSpeedLabel = (speed) => {
    if (speed === 0) return { text: 'Waiting...', color: 'text-white/40' };
    if (speed < 3) return { text: 'Slow', color: 'text-amber-400' };
    if (speed < 6) return { text: 'Average', color: 'text-blue-400' };
    if (speed < 9) return { text: 'Fast', color: 'text-emerald-400' };
    return { text: 'Very Fast', color: 'text-purple-400' };
  };

  const speedLabel = getSpeedLabel(currentSpeed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Behavioral Analytics</h3>
          <p className="text-sm text-white/50">Auto-tracking keystroke & session data</p>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Typing Speed */}
        <motion.div
          className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center"
          animate={{ borderColor: currentSpeed > 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.1)' }}
        >
          <Keyboard className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-mono-nums">{currentSpeed}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">char/sec</p>
          <p className={`text-xs font-bold mt-1 ${speedLabel.color}`}>{speedLabel.text}</p>
        </motion.div>

        {/* Session Duration */}
        <motion.div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center">
          <Timer className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-mono-nums">{formatDuration(sessionDuration)}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">session</p>
          <p className="text-xs font-bold mt-1 text-emerald-400">Active</p>
        </motion.div>

        {/* Time of Activity */}
        <motion.div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center">
          <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-mono-nums">
            {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">current</p>
          <p className="text-xs font-bold mt-1 text-purple-400">
            {new Date().getHours() >= 22 || new Date().getHours() < 6 ? 'Late Night' : 
             new Date().getHours() < 12 ? 'Morning' :
             new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
          </p>
        </motion.div>
      </div>

      {/* Typing Speed Test */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-bold text-white">Typing Speed Calibration</p>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
            LIVE
          </span>
        </div>
        <p className="text-xs text-white/40 mb-3">Type in the box below to calibrate keystroke dynamics</p>
        <textarea
          value={typingTest}
          onChange={handleTyping}
          disabled={disabled}
          rows={3}
          placeholder="Start typing here... The quick brown fox jumps over the lazy dog."
          className="
            w-full px-4 py-3 rounded-xl text-sm
            bg-black/30 border border-white/10
            text-white placeholder-white/20
            focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
            resize-none transition-all duration-300
            disabled:opacity-40
          "
        />
        {/* Speed visualization bar */}
        <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            animate={{ width: `${Math.min(100, (currentSpeed / 12) * 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Data Collection Summary */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <p className="text-xs text-emerald-400">
          Behavioral data auto-captured — {keystrokeTimestamps.length} keystroke samples collected
        </p>
      </div>
    </motion.div>
  );
}
