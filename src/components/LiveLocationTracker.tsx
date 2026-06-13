import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Compass, Navigation, Eye, EyeOff, Radio, 
  Battery, Heart, Info, Map as MapIcon, RefreshCw, AlertTriangle
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// Define the Location interface matching firestore-blueprint
interface LiveLocation {
  id: string; // 'milli' or 'sbu'
  name: string; // 'Milli 🤍' or 'Sbu 🤍'
  lat: number;
  lng: number;
  isSharing: boolean;
  updatedAt: string;
  batteryLevel?: number;
  statusMessage?: string;
}

interface LiveLocationTrackerProps {
  boyfriendImage?: string;
  girlfriendImage?: string;
  currentUserProfile?: 'Girlfriend' | 'Boyfriend';
}

// Haversine Distance Formula
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export default function LiveLocationTracker({ 
  boyfriendImage, 
  girlfriendImage, 
  currentUserProfile 
}: LiveLocationTrackerProps) {
  const [locations, setLocations] = useState<{ [key: string]: LiveLocation }>({
    milli: {
      id: 'milli',
      name: 'Milli 🤍',
      lat: -26.2041, // Johannesburg default
      lng: 28.0473,
      isSharing: false,
      updatedAt: '',
      batteryLevel: 100,
      statusMessage: 'Johannesburg, GP'
    },
    sbu: {
      id: 'sbu',
      name: 'Sbu 🤍',
      lat: -26.1952,
      lng: 28.0340,
      isSharing: false,
      updatedAt: '',
      batteryLevel: 100,
      statusMessage: 'Johannesburg, GP'
    }
  });

  const [currentUser, setCurrentUser] = useState<'milli' | 'sbu'>(
    currentUserProfile === 'Boyfriend' ? 'sbu' : 'milli'
  );

  useEffect(() => {
    if (currentUserProfile) {
      setCurrentUser(currentUserProfile === 'Boyfriend' ? 'sbu' : 'milli');
    }
  }, [currentUserProfile]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);

  // Subscribe to real-time sharing updates in Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'live_locations', 'milli'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LiveLocation;
        setLocations(prev => ({ ...prev, milli: data }));
      }
    }, (error) => {
      console.error('Error listening to Milli location:', error);
    });

    const unsubSbu = onSnapshot(doc(db, 'live_locations', 'sbu'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LiveLocation;
        setLocations(prev => ({ ...prev, sbu: data }));
      }
    }, (error) => {
      console.error('Error listening to Sbu location:', error);
    });

    return () => {
      unsub();
      unsubSbu();
    };
  }, []);

  // Update battery level dynamically on load
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const level = Math.round(battery.level * 100);
        updateFirestoreLocationField('batteryLevel', level);
        
        battery.addEventListener('levelchange', () => {
          updateFirestoreLocationField('batteryLevel', Math.round(battery.level * 100));
        });
      });
    }
  }, [currentUser]);

  // Handle active browser GPS geolocation tracking if sharing is switched ON
  useEffect(() => {
    const activeUserRecord = locations[currentUser];
    
    if (activeUserRecord.isSharing) {
      if (!navigator.geolocation) {
        setGeoError("Geolocation is not supported by your browser");
        return;
      }

      setGeoError(null);
      setIsLocLoading(true);

      // Get initial position with speed
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updatePosition(position.coords.latitude, position.coords.longitude);
          setIsLocLoading(false);
        },
        (error) => {
          console.warn("Geolocation permission or fix failed.", error.message);
          setGeoError(
            "GPS access blocked. Please click \"Open App in New Tab\" in the upper right to enable native device location tracking!"
          );
          setIsLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );

      // Watch position for continuous real-time movement updates
      const id = navigator.geolocation.watchPosition(
        (position) => {
          updatePosition(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Watch position error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );

      setWatchId(id);
    } else {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [currentUser, locations[currentUser].isSharing]);

  const updatePosition = async (latitude: number, longitude: number) => {
    const record = locations[currentUser];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let geocodedName = record.statusMessage || 'Active';
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`,
        { headers: { 'User-Agent': 'CompanionRadar/1.0' } }
      );
      if (resp.ok) {
        const d = await resp.json();
        const addr = d.address || {};
        // Find most granular descriptor
        geocodedName = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.city_district || addr.city || addr.town || addr.municipality || 'Active';
      }
    } catch (e) {
      console.warn("Reverse-geocoding fetch deferred:", e);
    }

    const updated: LiveLocation = {
      ...record,
      lat: Number(latitude.toFixed(6)),
      lng: Number(longitude.toFixed(6)),
      updatedAt: timestamp,
      statusMessage: geocodedName,
    };

    try {
      await setDoc(doc(db, 'live_locations', currentUser), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `live_locations/${currentUser}`);
    }
  };

  const updateFirestoreLocationField = async (field: keyof LiveLocation, value: any) => {
    const record = locations[currentUser];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = {
      ...record,
      [field]: value,
      updatedAt: timestamp
    };
    try {
      await setDoc(doc(db, 'live_locations', currentUser), updated);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSharing = async () => {
    const currentlySharing = locations[currentUser].isSharing;
    const newSharingState = !currentlySharing;
    updateFirestoreLocationField('isSharing', newSharingState);
  };

  const milliLoc = locations.milli;
  const sbuLoc = locations.sbu;

  // Render variables
  const isMilliSharing = milliLoc.isSharing;
  const isSbuSharing = sbuLoc.isSharing;

  // Dynamically calculate distance using Haversine
  const distanceKm = getHaversineDistance(milliLoc.lat, milliLoc.lng, sbuLoc.lat, sbuLoc.lng);

  // Dynamic compass radar center so pins are always centered relative to each other!
  const centerLat = (isMilliSharing && isSbuSharing) 
    ? (milliLoc.lat + sbuLoc.lat) / 2 
    : (isMilliSharing ? milliLoc.lat : (isSbuSharing ? sbuLoc.lat : -26.2041));

  const centerLng = (isMilliSharing && isSbuSharing) 
    ? (milliLoc.lng + sbuLoc.lng) / 2 
    : (isMilliSharing ? milliLoc.lng : (isSbuSharing ? sbuLoc.lng : 28.0473));

  // Visual scaling mapping coefficient for flat radar
  const scaleRatio = 3500; // zoom intensity on the flat radar grid

  return (
    <div className="py-20 px-4 md:px-12 bg-bg-deep border-t border-border-subtle relative overflow-hidden" id="live-location-sharing">
      {/* Background radial effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-72 h-72 bg-violet-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-accent animate-spin-slow" />
              <span className="text-accent font-black uppercase tracking-[0.3em] text-xs">
                Private Companion Link
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter">
              Live Location Radar
            </h2>
            <p className="text-text-dim text-xs md:text-sm max-w-xl leading-relaxed">
              Connect privately. Toggle location sharing to stream your real-time browser GPS coordinates. Disable anytime for complete control and offline security.
            </p>
          </div>

          {/* User selector tab */}
          <div className="flex bg-black/40 p-1.5 rounded-full border border-white/10 self-start">
            <button
              onClick={() => setCurrentUser('milli')}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentUser === 'milli' 
                  ? 'bg-accent text-white shadow-lg' 
                  : 'text-text-dim hover:text-white'
              }`}
            >
              👩‍🦳 Milli (GF)
            </button>
            <button
              onClick={() => setCurrentUser('sbu')}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentUser === 'sbu' 
                  ? 'bg-violet-500 text-white shadow-lg' 
                  : 'text-text-dim hover:text-white'
              }`}
            >
              🧔 Sbu (BF)
            </button>
          </div>
        </div>

        {/* Info or error alerts */}
        {geoError && locations[currentUser].isSharing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-xs text-rose-200 leading-relaxed flex items-start gap-3 max-w-2xl"
          >
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wider text-rose-400 mb-0.5">Sandboxed Geolocation Limitation</p>
              <p>{geoError}</p>
            </div>
          </motion.div>
        )}

        {/* Real-time Browser Coordinates Stream Display ("written above") */}
        {(isMilliSharing || isSbuSharing) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-accent/15 via-purple-500/10 to-transparent border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                <MapPin className="text-accent w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest block">Active GPS Satellite Stream</span>
                <p className="text-xs text-white font-medium">Real-time coordinates fetched recursively using the browser's native Geolocation API.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              {isMilliSharing && (
                <div className="px-4 py-3 rounded-xl bg-black/60 border border-[#ff2d55]/30 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ff2d55] animate-ping" />
                  <div>
                    <span className="text-[9px] font-black text-[#ff2d55] uppercase tracking-wider block">Milli (Girlfriend)</span>
                    <span className="text-[11px] font-mono font-bold text-white block">
                      LAT: {milliLoc.lat.toFixed(5)} / LNG: {milliLoc.lng.toFixed(5)}
                    </span>
                    <span className="text-[8px] text-zinc-400 block mt-0.5">Updated at {milliLoc.updatedAt || 'just now'}</span>
                  </div>
                </div>
              )}
              {isSbuSharing && (
                <div className="px-4 py-3 rounded-xl bg-black/60 border border-violet-500/30 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                  <div>
                    <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider block">Sbu (Boyfriend)</span>
                    <span className="text-[11px] font-mono font-bold text-white block">
                      LAT: {sbuLoc.lat.toFixed(5)} / LNG: {sbuLoc.lng.toFixed(5)}
                    </span>
                    <span className="text-[8px] text-zinc-400 block mt-0.5">Updated at {sbuLoc.updatedAt || 'just now'}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Controls & Status Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Sharing Switch Card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${locations[currentUser].isSharing ? 'text-accent animate-pulse' : 'text-text-dim'}`} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-text-dim">Device State</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    locations[currentUser].isSharing 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-zinc-800 text-text-dim border border-zinc-700/50'
                  }`}>
                    {locations[currentUser].isSharing ? 'Sharing Live' : 'Offline'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <span>{currentUser === 'milli' ? 'Milli (Girlfriend)' : 'Sbu (Boyfriend)'}</span>
                  </h3>
                  <p className="text-xs text-text-dim leading-relaxed font-light">
                    {locations[currentUser].isSharing 
                      ? "Your actual device GPS coordinates are updating continuously. Tap switch off to stop sharing immediately." 
                      : "Location transmission is disabled. Click the button to pinpoint yourself on the map below using your smartphone or desktop GPS context."
                    }
                  </p>
                </div>

                {/* Editable Status/Location Name input */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-accent block">
                    ✏️ Location Label (Below Avatar)
                  </label>
                  <input
                    type="text"
                    value={locations[currentUser].statusMessage || ''}
                    onChange={(e) => updateFirestoreLocationField('statusMessage', e.target.value)}
                    placeholder="e.g. Home, Maboneng, Sandton, Cafe"
                    className="w-full bg-black/60 border border-[#ffffff10] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Large Sharing Trigger Button */}
              <div className="space-y-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleSharing}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg border cursor-pointer ${
                    locations[currentUser].isSharing
                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30'
                      : 'bg-accent hover:opacity-95 text-white border-accent/20'
                  }`}
                >
                  {isLocLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Pinpoint Location...
                    </>
                  ) : locations[currentUser].isSharing ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Switch Off Sharing
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Share My Live Location
                    </>
                  )}
                </motion.button>

                {locations[currentUser].isSharing && (
                  <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[10px] uppercase font-bold text-text-dim">
                    <span>Battery Status</span>
                    <span className="text-emerald-400 font-extrabold">{locations[currentUser].batteryLevel || 100}% ⚡</span>
                  </div>
                )}
              </div>
            </div>

            {/* Simple device indicator */}
            <div className="p-6 rounded-2xl border border-white/5 bg-black/20 text-xs text-text-dim space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent block">System Diagnostics</span>
              <p className="leading-relaxed font-light">
                This radar does not simulate coordinates. It requests secure browser location parameters. If coordinates seem stale, check device GPS options or browse outside of a sandboxed platform window.
              </p>
            </div>

          </div>

          {/* RIGHT: Dynamic Radar Compass View */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="relative rounded-2xl border border-white/5 overflow-hidden flex-1 min-h-[480px] bg-zinc-950 shadow-2xl flex flex-col justify-between">
              
              {/* Map Title Overlay */}
              <div className="absolute top-4 left-4 z-40 bg-black/85 backdrop-blur-md px-4 py-3 border border-white/10 rounded-lg flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-accent rounded-full animate-ping" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">Compass Screen</h4>
                  <p className="text-[10px] text-text-dim font-light mt-1">
                    {isMilliSharing && isSbuSharing 
                      ? `Companion Sync Active · Proximity: ${distanceKm.toFixed(2)} km 🤍`
                      : !isMilliSharing && !isSbuSharing 
                        ? 'Both markers offline · toggle tracking'
                        : `${isMilliSharing ? 'Milli' : 'Sbu'} active · waiting for matching companion link...`
                    }
                  </p>
                </div>
              </div>

              {/* Elegant custom Radar circles directly */}
              <div id="radar-screen-canvas" className="relative w-full flex-1 bg-[radial-gradient(circle_at_center,_#0b0b0e_0%,_#030304_100%)] min-h-[440px] flex items-center justify-center overflow-hidden border-b border-white/5">
                
                {/* Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Dynamic sweeping line aesthetic */}
                <div className="absolute w-[440px] h-[440px] rounded-full border border-white/5 flex items-center justify-center opacity-60">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-spin-slow rotate-45" />
                </div>

                {/* Concentric rings */}
                <div className="absolute w-[200px] h-[200px] rounded-full border border-accent/5 animate-pulse" />
                <div className="absolute w-[340px] h-[340px] rounded-full border border-violet-500/10" />
                <div className="absolute w-[480px] h-[480px] rounded-full border border-white/5" />
                
                {/* Center of mutual presence */}
                <div className="absolute w-2 h-2 rounded-full bg-accent" />

                {/* Render Pins (relative layout mapping based on dynamic centers) */}
                <AnimatePresence>
                  {isMilliSharing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: (milliLoc.lng - centerLng) * scaleRatio,
                        y: -(milliLoc.lat - centerLat) * scaleRatio
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      className="absolute z-30"
                    >
                      <div className="absolute -inset-4 rounded-full bg-[#ff2d55]/20 border border-[#ff2d55]/30 animate-ping" />
                      <div className="relative group flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-2 border-[#ff2d55] shadow-2xl overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={girlfriendImage || "images/millicent1.jpg"} 
                            alt="Milli" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {/* Location address/name directly below the avatar circle */}
                        <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 shadow-xl text-center flex flex-col items-center min-w-[90px] border-l-2 border-l-[#ff2d55] pointer-events-none">
                          <span className="text-[10px] font-black text-white/90 leading-none">
                            Milli 🤍
                          </span>
                          <span className="text-[9px] text-[#ff2d55] font-black block truncate max-w-[85px] leading-tight mt-0.5">
                            {milliLoc.statusMessage || "Johannesburg"}
                          </span>
                        </div>

                        {/* Hover Details above */}
                        <div className="absolute bottom-full mb-3 bg-black/95 border border-white/15 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-[#ff2d55] whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 duration-200 pointer-events-none z-50">
                          👩‍🦳 MILLI (GF)
                          <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Updated {milliLoc.updatedAt || 'just now'}</span>
                          <span className="block text-[7.5px] text-zinc-500 font-mono mt-0.5">{milliLoc.lat.toFixed(4)}, {milliLoc.lng.toFixed(4)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isSbuSharing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: (sbuLoc.lng - centerLng) * scaleRatio,
                        y: -(sbuLoc.lat - centerLat) * scaleRatio
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      className="absolute z-30"
                    >
                      <div className="absolute -inset-4 rounded-full bg-violet-500/20 border border-violet-500/30 animate-ping" />
                      <div className="relative group flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-2 border-violet-500 shadow-2xl overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={boyfriendImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"} 
                            alt="Sbu" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {/* Location address/name directly below the avatar circle */}
                        <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 shadow-xl text-center flex flex-col items-center min-w-[90px] border-l-2 border-l-violet-500 pointer-events-none">
                          <span className="text-[10px] font-black text-white/90 leading-none">
                            Sbu 🤍
                          </span>
                          <span className="text-[9px] text-violet-400 font-black block truncate max-w-[85px] leading-tight mt-0.5">
                            {sbuLoc.statusMessage || "Johannesburg"}
                          </span>
                        </div>

                        {/* Hover Details above */}
                        <div className="absolute bottom-full mb-3 bg-black/95 border border-white/15 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-violet-300 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 duration-200 pointer-events-none z-50">
                          🧔 SBU (BF)
                          <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Updated {sbuLoc.updatedAt || 'just now'}</span>
                          <span className="block text-[7.5px] text-zinc-500 font-mono mt-0.5">{sbuLoc.lat.toFixed(4)}, {sbuLoc.lng.toFixed(4)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Offline view */}
                {!isMilliSharing && !isSbuSharing && (
                  <div className="absolute z-20 text-center px-10 py-8 bg-zinc-950/90 border border-white/5 rounded-2xl max-w-sm backdrop-blur-md space-y-3">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto text-text-dim text-lg">
                      📡
                    </div>
                    <h5 className="text-white text-sm font-black uppercase tracking-wider">Compass Sync Suspended</h5>
                    <p className="text-[11px] text-text-dim leading-relaxed font-light">
                      Please secure browser privileges, toggle the active mode on top, and tap <strong className="text-accent underline">Share My Live Location</strong> below.
                    </p>
                  </div>
                )}

              </div>

              {/* Match state tracker */}
              <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-text-dim">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent animate-pulse" />
                  <span>
                    {isMilliSharing && isSbuSharing 
                      ? "Your companion links are successfully synchronized to your exact coordinates!"
                      : "Awaiting mutual transmission to compute distance overlay grid and synchronicity maps."
                    }
                  </span>
                </div>
                {isMilliSharing && isSbuSharing && (
                  <div className="text-[10px] bg-gradient-to-r from-accent to-red-600 px-3 py-1 text-white font-black uppercase tracking-widest rounded-md shadow-md animate-pulse">
                    Companion Link: LIVE 💖
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
