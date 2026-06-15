import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShoppingBag, Radio, Compass, Rocket, Award, ShieldAlert, Cpu } from 'lucide-react';
import { sounds } from './AudioEngine';

interface UpgradeItem {
  id: string;
  name: string;
  cost: number;
  cps: number; // Stardust per second
  cpc: number; // Stardust per click bonus
  count: number;
  icon: string;
  desc: string;
}

export default function IdleGame() {
  const [stardust, setStardust] = useState<number>(0);
  const [totalMined, setTotalMined] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [cps, setCps] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const asteroidRef = useRef<HTMLButtonElement>(null);

  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: '1', name: 'Scrap Magnet', cost: 15, cps: 0.2, cpc: 1, count: 0, icon: 'Compass', desc: 'Pulls dynamic orbital stardust. Adds +0.2 CPS.' },
    { id: '2', name: 'Solar Excavator', cost: 100, cps: 1.5, cpc: 0, count: 0, icon: 'Cpu', desc: 'Beams high energy thermal rays to extract rocks. Adds +1.5 CPS.' },
    { id: '3', name: 'Gravity Harvester', cost: 1100, cps: 8, cpc: 4, count: 0, icon: 'Radio', desc: 'Manipulates localized mass. Adds +8 CPS and +4 clicks.' },
    { id: '4', name: 'Nebula Dredger', cost: 12000, cps: 47, cpc: 0, count: 0, icon: 'Rocket', desc: 'Siphons deep cosmos cloud corridors. Adds +47 CPS.' },
    { id: '5', name: 'Quantum Assembler', cost: 85000, cps: 260, cpc: 50, count: 0, icon: 'Sparkles', desc: 'Materializes matter cleanly from photons. Adds +260 CPS and +50 clicks.' },
  ]);

  // Load state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unblocked_games_idle_stardust');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.stardust === 'number') setStardust(parsed.stardust);
        if (typeof parsed.totalMined === 'number') setTotalMined(parsed.totalMined);
        if (parsed.upgrades && Array.isArray(parsed.upgrades)) {
          setUpgrades(parsed.upgrades);
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Save state
  useEffect(() => {
    try {
      const state = { stardust, totalMined, upgrades };
      localStorage.setItem('unblocked_games_idle_stardust', JSON.stringify(state));
    } catch {}
  }, [stardust, totalMined, upgrades]);

  // CPS Calculations
  useEffect(() => {
    let currentCps = 0;
    let extraClick = 1;
    upgrades.forEach(item => {
      currentCps += item.cps * item.count;
      extraClick += item.cpc * item.count;
    });
    setCps(currentCps);
    setClickPower(extraClick);
  }, [upgrades]);

  // Keep ticking
  useEffect(() => {
    const interval = setInterval(() => {
      if (cps > 0) {
        setStardust(prev => prev + cps / 10);
        setTotalMined(prev => prev + cps / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  // Click Handler
  const handleAsteroidClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sounds.playClick();
    setStardust(prev => prev + clickPower);
    setTotalMined(prev => prev + clickPower);
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 200);

    // Get click coords for floating text
    if (asteroidRef.current) {
      const rect = asteroidRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (Math.random() * 40 - 20);
      const y = e.clientY - rect.top + (Math.random() * 40 - 20);
      const id = Date.now() + Math.random();
      
      setFloatingTexts(prev => [...prev, { id, x, y, text: `+${clickPower.toFixed(0)}` }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(item => item.id !== id));
      }, 800);
    }
  };

  const buyUpgrade = (id: string) => {
    const item = upgrades.find(up => up.id === id);
    if (!item || stardust < item.cost) return;

    sounds.playScore();
    setStardust(prev => prev - item.cost);
    setUpgrades(prev => prev.map(up => {
      if (up.id === id) {
        return {
          ...up,
          count: up.count + 1,
          cost: Math.round(up.cost * 1.15)
        };
      }
      return up;
    }));
  };

  // Icon chooser
  const renderUpgradeIcon = (icon: string) => {
    switch (icon) {
      case 'Compass': return <Compass className="w-5 h-5 text-indigo-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'Rocket': return <Rocket className="w-5 h-5 text-rose-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl bg-[#0f172a] text-gray-100 rounded-xl p-6 shadow-2xl border border-indigo-950/50 flex flex-col md:flex-row gap-6 relative overflow-hidden">
      {/* Background visual galaxy effect */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none select-none"></div>

      {/* Mining Module */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800/80 pb-6 md:pb-0 md:pr-6 relative z-10">
        <div className="text-center w-full">
          <span className="text-[10px] tracking-widest text-indigo-400 font-mono uppercase">Deep Space Mining Core</span>
          <h2 className="text-2xl font-bold text-white mt-1 font-sans">{stardust.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-400">stardust</span></h2>
          <div className="text-xs text-slate-400 font-mono mt-1 flex justify-center gap-4">
            <span>CPS: {cps.toFixed(1)}</span>
            <span>Click Value: +{clickPower.toFixed(0)}</span>
          </div>
        </div>

        {/* Large Clicking Asteroid */}
        <div className="relative my-8 flex items-center justify-center select-none">
          {/* Pulsing orbit glows */}
          <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 blur-xl animate-pulse"></div>
          <div className="absolute w-32 h-32 rounded-full border border-indigo-500/20 animate-spin" style={{ animationDuration: '20s' }}></div>
          
          <button
            id="idle-asteroid-btn"
            ref={asteroidRef}
            onClick={handleAsteroidClick}
            className={`relative w-40 h-40 rounded-full bg-gradient-to-tr from-slate-700 via-slate-600 to-indigo-800 border-4 border-slate-500 hover:border-indigo-400 shadow-2xl focus:outline-none flex items-center justify-center transform active:scale-95 transition-all outline-none cursor-pointer ${isRotating ? 'scale-105 rotate-6' : ''}`}
          >
            {/* Asteroid Surface Details */}
            <div className="absolute inset-0 rounded-full opacity-30 bg-[radial-gradient(circle_at_20%_20%,transparent_00%,black_80%)]"></div>
            
            {/* Crater 1 */}
            <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-slate-800/50 border border-slate-900 shadow-inner"></div>
            {/* Crater 2 */}
            <div className="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-slate-800/50 border border-slate-900 shadow-inner"></div>
            {/* Crater 3 */}
            <div className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full bg-slate-800/50 border border-slate-900 shadow-inner"></div>

            <Sparkles className="w-10 h-10 text-indigo-200/40 animate-pulse pointer-events-none" />

            {/* Floating Clicks */}
            {floatingTexts.map(text => (
              <span
                key={text.id}
                className="absolute text-brand bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold text-sm pointer-events-none animate-bounce font-mono text-indigo-300 z-50 select-none"
                style={{ left: text.x, top: text.y }}
              >
                {text.text}
              </span>
            ))}
          </button>
        </div>

        {/* Small stats summary */}
        <div className="text-center w-full">
          <span className="text-[10px] text-slate-500 font-mono">Lifetime minerals mined: {totalMined.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <button
            id="idle-reset-btn"
            onClick={() => {
              if (confirm('Are you sure you want to hard reset your space mine? This wipes stardust and upgrades.')) {
                sounds.playExplosion();
                setStardust(0);
                setTotalMined(0);
                setUpgrades(upgrades.map(u => ({ ...u, count: 0, cost: u.id === '1' ? 15 : u.id === '2' ? 100 : u.id === '3' ? 1100 : u.id === '4' ? 12000 : 85000 })));
              }
            }}
            className="block mx-auto mt-2 text-[9px] text-slate-600 hover:text-rose-400 underline transition cursor-pointer"
          >
            Hard Reset Station
          </button>
        </div>
      </div>

      {/* Upgrade Store Module */}
      <div className="w-full md:w-1/2 flex flex-col justify-between relative z-10">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-sans">Astro-Engineering Store</h3>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[340px] overflow-auto pr-1 flex-1">
          {upgrades.map(item => {
            const canBuy = stardust >= item.cost;
            return (
              <button
                id={`idle-buy-${item.id}`}
                key={item.id}
                disabled={!canBuy}
                onClick={() => buyUpgrade(item.id)}
                className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition group cursor-pointer ${canBuy ? 'bg-slate-900 hover:bg-slate-800 border-indigo-900/50 hover:border-indigo-500' : 'bg-slate-900/30 border-slate-850/50 opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-950/60 flex items-center justify-center border border-slate-800">
                    {renderUpgradeIcon(item.icon)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition">{item.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span className={`text-xs font-bold font-mono ${canBuy ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {item.cost} ★
                  </span>
                  <span className="text-[9px] text-indigo-500 mt-0.5 font-mono">Owned: {item.count}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Stardust is mined & saved locally</span>
          <span className="text-indigo-400 flex items-center gap-1"><Award className="w-3 h-3" /> Space Station Elite</span>
        </div>
      </div>
    </div>
  );
}
