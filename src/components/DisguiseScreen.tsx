import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, Share2, HelpCircle, ArrowLeft, Check, CheckSquare, Plus, Trash2, Save
} from 'lucide-react';
import { sounds } from './AudioEngine';

interface DisguiseScreenProps {
  onExit: () => void;
}

export default function DisguiseScreen({ onExit }: DisguiseScreenProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'notes' | 'graph'>('docs');
  const [docContent, setDocContent] = useState<string>(
    `AP Biology - Unit 4: Cellular Respiration & Photosynthesis
Date: June 15, 2026

I. CELLULAR RESPIRATION OVERVIEW
Energy extraction from organic molecules to form ATP.
Reaction formula: C6H12O6 + 6O2 ---> 6CO2 + 6H2O + ~36 ATP

Three main sequential biological pathways:
1. Glycolysis
   - Occurs in the cytoplasm (anaerobic, ancient evolutionary pathway)
   - Inputs: 1 Glucose, 2 NAD+, 2 ATP, 4 ADP
   - Outputs: 2 Pyruvate, 2 NADH, 4 ATP (Net gain of 2 ATP)
   - Key enzyme: Phosphofructokinase (allosteric regulation by ATP)

2. The Krebs Cycle (Citric Acid Cycle)
   - Occurs in the mitochondrial matrix (aerobic)
   - Pyruvate is converted to Acetyl-CoA (generating 1 NADH and 1 CO2)
   - Cycle generates per glucose: 6 NADH, 2 FADH2, 2 ATP, 4 CO2
   - These electron carrier vectors (NADH/FADH2) store vital chemical payloads.

3. Oxidative Phosphorylation & Electron Transport Chain (ETC)
   - Takes place along the inner mitochondrial membrane (cristae)
   - High-energy electrons create a proton gradient across the membrane.
   - ATP Synthase acts as a rotary engine, utilizing the proton motive force to synthesize ADP + Pi into ATP.
   - Oxygen is the final electron acceptor, combining with protons to form H2O.
`
  );

  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  // Notes App Simulator
  const [notes, setNotes] = useState<{ id: string; title: string; content: string }[]>([
    {
      id: '1',
      title: 'Calc Exam Formulas',
      content: 'Limit definition: f\'(x) = lim(h->0) [f(x+h) - f(x)]/h\nProduct Rule: d/dx[uv] = u\'v + uv\'\nQuotient Rule: d/dx[u/v] = (u\'v - uv\') / v^2\nIntegration by parts: Integral(u dv) = uv - Integral(v du)'
    },
    {
      id: '2',
      title: 'English Lit Essay Ideas',
      content: 'Thesis: Macbeth\'s downfall reflects the deterministic weight of hubris rather than absolute supernatural agency.\nKey scenes: Banquo\'s ghost (guilt manifestation), tomorrow speech (total nihilism).'
    }
  ]);
  const [selectedNoteId, setSelectedNoteId] = useState('1');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Graphing Calculator State
  const [formula, setFormula] = useState<string>('sin(x) * 2');
  const [scale, setScale] = useState<number>(30);

  const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocContent(e.target.value);
  };

  const handleUnlockAttempt = () => {
    if (password.toLowerCase() === 'play' || password === '') {
      sounds.playScore();
      onExit();
    } else {
      setErrorText('Incorrect verification token. Please try again.');
      setTimeout(() => setErrorText(''), 2000);
    }
  };

  // Keyboard shortcut listener to exit disguise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret key combination Shift + Alt + U unlocks instantly
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'u') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // SVG Graph plotting
  const renderGraphPoints = () => {
    const points: string[] = [];
    const width = 500;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let screenX = 0; screenX < width; screenX += 2) {
      const mathX = (screenX - centerX) / scale;
      let mathY = 0;

      try {
        // Safe limited evaluations
        if (formula.includes('sin')) {
          mathY = Math.sin(mathX);
        } else if (formula.includes('cos')) {
          mathY = Math.cos(mathX);
        } else if (formula.includes('tan')) {
          mathY = Math.tan(mathX);
        } else if (formula.includes('x^2')) {
          mathY = mathX * mathX * 0.1;
        } else {
          // Fallback linear
          mathY = mathX * 0.5;
        }

        // Apply scale factors from formula
        if (formula.includes('*')) {
          const parts = formula.split('*');
          const multiplier = parseFloat(parts[1]);
          if (!isNaN(multiplier)) mathY *= multiplier;
        }
        if (formula.includes('+')) {
          const parts = formula.split('+');
          const adder = parseFloat(parts[1]);
          if (!isNaN(adder)) mathY += adder;
        }

        const screenY = centerY - (mathY * scale);
        
        if (screenY >= 0 && screenY <= height) {
          points.push(`${screenX},${screenY}`);
        }
      } catch {
        // Safe fallback
      }
    }
    return points.join(' ');
  };

  return (
    <div id="disguise-screen-viewport" className="fixed inset-0 bg-white text-gray-800 z-50 overflow-auto font-sans">
      {/* Simulation Bar */}
      <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-blue-600 cursor-pointer" onClick={() => setShowPasswordModal(true)}>
            <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center font-bold">D</div>
            <span className="text-gray-800 font-medium">Docs Space - Edu Portal</span>
          </div>
          <div className="flex gap-4">
            <button 
              id="disguise-tab-docs"
              onClick={() => { sounds.playClick(); setActiveTab('docs'); }} 
              className={`pb-1 font-medium border-b-2 hover:text-gray-800 transition ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
            >
              School Research Document
            </button>
            <button 
              id="disguise-tab-notes"
              onClick={() => { sounds.playClick(); setActiveTab('notes'); }} 
              className={`pb-1 font-medium border-b-2 hover:text-gray-800 transition ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
            >
              My Study Notes
            </button>
            <button 
              id="disguise-tab-graph"
              onClick={() => { sounds.playClick(); setActiveTab('graph'); }} 
              className={`pb-1 font-medium border-b-2 hover:text-gray-800 transition ${activeTab === 'graph' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
            >
              Mathematical Grapher
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved to Cloud Drive
          </span>
          <button 
            id="disguise-exit-btn"
            onClick={() => setShowPasswordModal(true)} 
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded flex items-center gap-1.5 transition text-xs shadow-sm cursor-pointer"
          >
            <Share2 className="w-3 h-3" /> Share Work
          </button>
        </div>
      </div>

      {/* Main Educational Simulators */}
      <div className="min-h-[calc(100vh-45px)] bg-[#f3f4f6] py-6 px-4 flex justify-center">
        {activeTab === 'docs' && (
          <div className="w-[850px] bg-white shadow-lg min-h-[1050px] p-16 flex flex-col border border-gray-200 text-sm tracking-wide relative">
            {/* Toolbar simulator */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-gray-200 bg-[#f8f9fa] flex items-center px-4 gap-4 text-gray-600 text-xs">
              <span className="font-semibold text-gray-800">Untitled Document</span>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex gap-3">
                <Bold className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                <Italic className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                <Underline className="w-4 h-4 cursor-pointer hover:text-gray-900" />
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex gap-3">
                <AlignLeft className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                <AlignCenter className="w-4 h-4 cursor-pointer hover:text-gray-900" />
                <AlignRight className="w-4 h-4 cursor-pointer hover:text-gray-900" />
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-[10px] text-gray-400 font-mono">Word Count: {docContent.split(/\s+/).filter(Boolean).length} words</span>
            </div>

            {/* Editable Content */}
            <textarea
              id="google-docs-textarea"
              value={docContent}
              onChange={handleDocChange}
              className="w-full h-full min-h-[900px] resize-none outline-none font-sans text-gray-800 leading-relaxed mt-4 bg-transparent"
              placeholder="Paste or type notes here..."
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden min-h-[500px]">
            {/* Sidebar */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-4">
              <h3 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Study Notes</h3>
              <div className="flex flex-col gap-1 overflow-auto flex-1">
                {notes.map(note => (
                  <button
                    id={`note-item-${note.id}`}
                    key={note.id}
                    onClick={() => { sounds.playClick(); setSelectedNoteId(note.id); }}
                    className={`text-left p-2.5 rounded transition text-xs ${selectedNoteId === note.id ? 'bg-amber-100 text-amber-900 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {note.title || 'Untitled Note'}
                  </button>
                ))}
              </div>

              {/* Add note */}
              <div className="flex gap-2 border-t border-gray-200 pt-3">
                <input
                  id="new-note-title-input"
                  type="text"
                  placeholder="New topic..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:border-amber-400 outline-none"
                />
                <button
                  id="add-note-btn"
                  onClick={() => {
                    sounds.playClick();
                    if (!newNoteTitle.trim()) return;
                    const newId = String(Date.now());
                    setNotes([...notes, { id: newId, title: newNoteTitle, content: 'Type note details here...' }]);
                    setSelectedNoteId(newId);
                    setNewNoteTitle('');
                  }}
                  className="bg-amber-500 text-white hover:bg-amber-600 rounded p-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Editor */}
            <div className="w-2/3 p-6 flex flex-col gap-4">
              {notes.find(n => n.id === selectedNoteId) ? (
                <>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h2 className="font-semibold text-gray-800 text-base">
                      {notes.find(n => n.id === selectedNoteId)?.title}
                    </h2>
                    <button
                      id="delete-note-btn"
                      onClick={() => {
                        sounds.playClick();
                        setNotes(notes.filter(n => n.id !== selectedNoteId));
                        if (notes.length > 1) {
                          setSelectedNoteId(notes[0].id);
                        }
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                  <textarea
                    id="note-content-editor"
                    className="w-full flex-1 resize-none outline-none font-mono text-gray-700 bg-transparent leading-relaxed text-xs p-2 bg-amber-50/20 border border-amber-100 rounded"
                    value={notes.find(n => n.id === selectedNoteId)?.content || ''}
                    onChange={(e) => {
                      setNotes(notes.map(n => n.id === selectedNoteId ? { ...n, content: e.target.value } : n));
                    }}
                  />
                  <div className="text-[10px] text-gray-400 text-right">Auto-saving locally...</div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <FileText className="w-10 h-10 stroke-1" />
                  <span>No study note selected</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-md border border-gray-200 flex flex-col p-6 gap-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
                <span>⚡ Grapher Simulator</span>
                <span className="text-xs font-normal text-gray-500">Solve & plot mathematical functions in real time</span>
              </h2>
            </div>
            
            <div className="flex gap-6 flex-1">
              {/* Formula Panel */}
              <div className="w-1/3 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Enter function y = f(x)</label>
                  <select
                    id="grapher-preset-select"
                    value={formula}
                    onChange={(e) => { sounds.playClick(); setFormula(e.target.value); }}
                    className="px-3 py-2 border border-gray-300 rounded text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="sin(x) * 2">Double Sine Wave: 2 * sin(x)</option>
                    <option value="cos(x)">Cosine Wave: cos(x)</option>
                    <option value="tan(x)">Tangent Wave: tan(x)</option>
                    <option value="x^2">Quadratic Parabola: 0.1 * x^2</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Custom Multiplier scale ({scale}px)</label>
                  <input
                    id="grapher-scale-slider"
                    type="range"
                    min="15"
                    max="60"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                  <div className="text-[10px] text-gray-400">Ramps up coordinate granularity recursively.</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-900 text-xs leading-relaxed">
                  <strong>Fun facts:</strong> Integrals of trigonometric formulas demonstrate immediate conservation laws. Play around with periodic sliders to research bounds.
                </div>
              </div>

              {/* Graphical Display */}
              <div className="w-2/3 flex flex-col items-center">
                <div className="border border-gray-300 rounded bg-gray-50 overflow-hidden relative shadow-inner p-2 w-[520px] h-[320px]">
                  <svg className="w-full h-full" viewBox="0 0 500 300">
                    {/* Grid lines */}
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="250" y1="0" x2="250" y2="300" stroke="#cbd5e1" strokeWidth="2" />
                    
                    {/* Tick marks */}
                    {Array.from({ length: 11 }).map((_, i) => {
                      const pos = (i * 50);
                      return (
                        <g key={i}>
                          <line x1={pos} y1="145" x2={pos} y2="155" stroke="#94a3b8" />
                          <line x1="245" y1={pos} x2="255" y2={pos} stroke="#94a3b8" />
                        </g>
                      );
                    })}

                    {/* Equation graph */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      points={renderGraphPoints()}
                    />
                  </svg>
                  <div className="absolute top-2 left-2 bg-white/80 border border-gray-200 text-[10px] px-2 py-0.5 rounded font-mono">
                    y = {formula}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 mt-2">Plotted in local canvas coordinates relative to Cartesian origin.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secret Exit Password Model */}
      {showPasswordModal && (
        <div id="unlock-modal-overlay" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-blue-600" /> Share Document Settings
              </h3>
              <button 
                id="close-unlock-modal-btn"
                onClick={() => { sounds.playClick(); setShowPasswordModal(false); }} 
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              To exit sharing mode or verify your secure network connection credentials, enter your class group verification key (default: <span className="font-mono text-blue-600 font-semibold bg-blue-50 px-1 py-0.5 rounded">play</span> or press Enter key).
            </p>

            <div className="flex flex-col gap-3">
              <input
                id="unlock-password-input"
                type="password"
                placeholder="Group authorization key..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlockAttempt();
                }}
                className="px-3 py-2 border border-gray-300 rounded text-xs focus:border-blue-500 outline-none"
                autoFocus
              />
              {errorText && (
                <span className="text-[10px] text-red-500 font-medium">{errorText}</span>
              )}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  id="cancel-unlock-btn"
                  onClick={() => { sounds.playClick(); setShowPasswordModal(false); }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition"
                >
                  Stay
                </button>
                <button
                  id="confirm-unlock-btn"
                  onClick={handleUnlockAttempt}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition cursor-pointer"
                >
                  Confirm Verify
                </button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <span className="text-[9px] text-gray-400 block font-mono">Tip: Press Shift+Alt+U anywhere to bypass instantly.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
