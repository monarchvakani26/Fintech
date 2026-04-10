// ============================================================
// Rakshak AI — Location Capture
// Auto GPS + manual override + reverse geocoding
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, RefreshCw, Edit3, Globe, CheckCircle } from 'lucide-react';

export default function LocationForm({ data, onChange, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const fetchGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);

        // Reverse geocode for city
        let city = data.city || '';
        let country = data.country || 'India';
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const geo = await res.json();
          city = geo.city || geo.locality || geo.principalSubdivision || '';
          country = geo.countryName || 'India';
        } catch {
          // Fallback — keep existing city
        }

        onChange({
          ...data,
          lat: latitude,
          lng: longitude,
          city,
          country,
          accuracy,
          source: 'GPS',
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [data, onChange]);

  // Auto-fetch on mount
  useEffect(() => {
    if (!data.lat && !disabled) {
      fetchGPS();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualChange = (field, value) => {
    const numVal = value === '' ? '' : Number(value);
    onChange({ ...data, [field]: numVal, source: 'manual' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Location Intelligence</h3>
          <p className="text-sm text-white/50">GPS auto-capture with manual override</p>
        </div>
      </div>

      {/* GPS Status Card */}
      <motion.div
        className={`
          p-4 rounded-xl border backdrop-blur-sm
          ${data.lat
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : error
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-white/5 border-white/10'
          }
        `}
        animate={{ scale: loading ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: loading ? Infinity : 0, duration: 1.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${data.lat ? 'bg-emerald-400 animate-pulse' : error ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-sm font-semibold text-white/80">
              {loading ? 'Acquiring GPS...' : data.lat ? 'Location Locked' : error ? 'GPS Error' : 'Awaiting GPS'}
            </span>
          </div>
          <button
            type="button"
            onClick={fetchGPS}
            disabled={loading || disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              bg-white/10 text-white/70 hover:bg-white/20 hover:text-white
              transition-all duration-300 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-2">{error}</p>
        )}

        {data.lat && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Latitude</p>
              <p className="text-sm font-mono font-bold text-white">{Number(data.lat).toFixed(6)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Longitude</p>
              <p className="text-sm font-mono font-bold text-white">{Number(data.lng).toFixed(6)}</p>
            </div>
            {data.city && (
              <div className="col-span-2 bg-black/20 rounded-lg p-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-white/40" />
                <div>
                  <p className="text-sm font-semibold text-white">{data.city}</p>
                  <p className="text-xs text-white/40">{data.country || 'India'}</p>
                </div>
                {gpsAccuracy && (
                  <span className="ml-auto text-[10px] text-white/30">±{Math.round(gpsAccuracy)}m</span>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Manual Override Toggle */}
      <button
        type="button"
        onClick={() => setManualMode(!manualMode)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        {manualMode ? 'Hide manual override' : 'Manual override'}
      </button>

      <AnimatePresence>
        {manualMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={data.lat ?? ''}
                  onChange={(e) => handleManualChange('lat', e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 disabled:opacity-40"
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={data.lng ?? ''}
                  onChange={(e) => handleManualChange('lng', e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 disabled:opacity-40"
                  placeholder="72.8777"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">City</label>
              <input
                type="text"
                value={data.city || ''}
                onChange={(e) => onChange({ ...data, city: e.target.value, source: 'manual' })}
                disabled={disabled}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 disabled:opacity-40"
                placeholder="Mumbai"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set as Home checkbox */}
      {data.lat && (
        <motion.label
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-all"
        >
          <input
            type="checkbox"
            checked={data.setAsHome || false}
            onChange={(e) => onChange({ ...data, setAsHome: e.target.checked })}
            className="w-4 h-4 rounded accent-orange-500"
          />
          <div>
            <p className="text-sm font-medium text-white">Set as home location</p>
            <p className="text-xs text-white/40">Used for distance-based fraud detection</p>
          </div>
        </motion.label>
      )}
    </motion.div>
  );
}
