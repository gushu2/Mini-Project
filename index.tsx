import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Chart from 'chart.js/auto';

// --- Configuration & Constants ---
const PROJECT_INFO = {
  title: "Neurocalm",
  subtitle: "Stress Detection and Control System for Student Well-Being",
  groupNo: "29",
  year: "2025-26"
};

const MOTIVATIONAL_QUOTES = [
  "Believe you can and you're halfway there.",
  "Peace begins with a smile.",
  "It always seems impossible until it's done.",
  "Do not let what you cannot do interfere with what you can do.",
  "You are stronger than you seem, braver than you believe, and smarter than you think.",
  "The best way out is always through.",
  "Breath is the bridge which connects life to consciousness.",
  "Every deep breath is a little rebirth."
];

// --- Local Logic (No API Key) ---
const getLocalResponse = (input, bpm, stressLevel) => {
  const lowerInput = input.toLowerCase();

  if (stressLevel === 'High' && (lowerInput.includes('stress') || lowerInput.includes('help'))) {
    return `I notice your heart rate is high (${bpm} BPM). Let's try to ground ourselves first. Can you name 3 things you see around you?`;
  }

  if (lowerInput.includes('exam') || lowerInput.includes('test') || lowerInput.includes('study')) {
    return "Exams can be overwhelming. Remember to take breaks—try the 25-minute study, 5-minute break method. You've got this.";
  }
  if (lowerInput.includes('tired') || lowerInput.includes('sleep') || lowerInput.includes('exhausted')) {
    return "Rest is productive too. If you're feeling drained, a 20-minute power nap might be more effective than pushing through.";
  }
  if (lowerInput.includes('anxio') || lowerInput.includes('panic') || lowerInput.includes('scared')) {
    return "I hear you. Anxiety is tough, but it passes. Let's focus on your exhale—make it longer than your inhale to calm your nervous system.";
  }
  if (lowerInput.includes('focus') || lowerInput.includes('concentrate')) {
    return "To improve focus, try clearing your physical workspace and doing a 1-minute box breathing exercise to reset your mind.";
  }
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return "Hello! I'm here to help you monitor your stress and stay balanced. How are you feeling right now?";
  }
  
  const defaults = [
    "I'm listening. Tell me more about how that feels.",
    "That sounds challenging. Taking a deep breath can sometimes help reset the perspective.",
    "I'm here to support you. Remember to check your breathing.",
    "Identifying these feelings is the first step to managing them."
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

// --- Helper Components ---

// 1. Arduino Code Modal (The "Code Language from Synopsis")
const ArduinoCodeModal = ({ onClose }) => {
  const code = `
// Copy this to your Arduino IDE
void setup() {
  Serial.begin(115200); // Matches App Baud Rate
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Example: Read Pulse Sensor
  int sensorValue = analogRead(A0);
  int bpm = calculateBPM(sensorValue); // Your logic
  
  // 1. Send BPM
  Serial.print("BPM:");
  Serial.println(bpm);
  
  // 2. Send Beat Trigger
  if (isBeat(sensorValue)) {
    Serial.println("Beat detected!");
  }
  
  // 3. Control Hardware Bulb
  if (bpm > 100) {
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("Bulb ON");
  } else {
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("Bulb OFF");
  }
  delay(20);
}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 className="text-xl font-bold mb-2 text-neuro-900">Arduino Sketch (C++)</h3>
        <p className="text-sm text-gray-500 mb-4">Upload this logic to your ESP32/Arduino to connect with the app.</p>
        <div className="flex-1 overflow-auto bg-gray-900 rounded-lg p-4 border border-gray-800">
          <pre className="text-green-400 font-mono text-sm whitespace-pre">{code}</pre>
        </div>
        <div className="mt-6 flex justify-end">
           <button onClick={() => navigator.clipboard.writeText(code)} className="mr-3 px-4 py-2 text-sm font-medium text-neuro-700 bg-neuro-100 rounded-lg hover:bg-neuro-200">Copy Code</button>
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-neuro-600 rounded-lg hover:bg-neuro-700">Done</button>
        </div>
      </div>
    </div>
  );
};

// 2. Heart Rate Visualization
const HeartIcon = ({ bpm, stressLevel, beatDetected }) => {
  const [scale, setScale] = useState(1);

  // Visual pulse specifically when Arduino sends "Beat detected!"
  useEffect(() => {
    if (beatDetected) {
        setScale(1.35); // Stronger pulse
        const timer = setTimeout(() => setScale(1), 150);
        return () => clearTimeout(timer);
    }
  }, [beatDetected]);

  const getColor = () => {
    if (stressLevel === 'High') return 'text-stress-high';
    if (stressLevel === 'Medium') return 'text-stress-med';
    return 'text-stress-low';
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <div 
        className={`absolute w-full h-full opacity-20 rounded-full ${getColor().replace('text-', 'bg-')} transition-all duration-150`}
        style={{ transform: `scale(${scale * 1.5})` }}
      ></div>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`w-12 h-12 ${getColor()} transition-transform duration-100 ease-out`}
        style={{ transform: `scale(${scale})` }}
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    </div>
  );
};

// 3. Breathing Exercise Modal
const BreathingExercise = ({ onClose }) => {
  const [phase, setPhase] = useState('Inhale');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          setPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 className="text-xl font-semibold mb-6 text-neuro-900">Box Breathing</h3>
        
        <div className="flex justify-center mb-8">
          <div className={`w-32 h-32 rounded-full bg-neuro-100 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${phase === 'Inhale' ? 'scale-125 bg-blue-200' : phase === 'Exhale' ? 'scale-90 bg-blue-50' : 'scale-110 bg-blue-100'}`}>
             <span className="text-4xl font-bold text-neuro-600">{countdown}</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-neuro-700 mb-2">{phase}</h2>
        <p className="text-gray-500">Focus on your breath. Inhale deeply, hold, and exhale slowly.</p>
      </div>
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  // -- State --
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [hrv, setHrv] = useState(0);
  const [stressLevel, setStressLevel] = useState('Low');
  const [bulbOn, setBulbOn] = useState(false);
  const [beatDetected, setBeatDetected] = useState(false); // Trigger for animation
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const notificationSent = useRef(false);

  const classifyStress = (currentBpm, currentHrv) => {
    if (currentBpm > 100) return 'High';
    if (currentBpm > 80) return 'Medium';
    return 'Low';
  };

  // -- Effect: Request Notifications Permission on mount --
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // -- Effect: Chart Initialization --
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Heart Rate (BPM)',
            data: [],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 40, max: 140, grid: { color: '#f1f5f9' } },
            x: { display: false }
          }
        }
      });
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  // -- Effect: Update Chart --
  useEffect(() => {
    if (!chartInstance.current) return;
    
    const now = new Date().toLocaleTimeString();
    const chart = chartInstance.current;

    if (bpm > 0) {
      chart.data.labels.push(now);
      chart.data.datasets[0].data.push(bpm);

      if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }
      chart.update();
    }
  }, [bpm]);

  // -- Logic: Serial Connection --
  const connectSerial = async () => {
    if (!(navigator as any).serial) {
      alert("Web Serial API not supported. Please use Chrome or Edge.");
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      // BAUD RATE 115200 matches standard ESP32/Arduino serial
      await port.open({ baudRate: 115200 });
      setIsConnected(true);
      setIsSimulating(false);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) { reader.releaseLock(); break; }
        
        if (value) {
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for(const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                
                // --- Strict Protocol Parsing ---
                
                // 1. Beat Detected (Instant trigger)
                if (trimmed.includes("Beat detected")) {
                    setBeatDetected(prev => !prev);
                }

                // 2. BPM Data (e.g., "BPM: 72")
                if (trimmed.startsWith("BPM:")) {
                    const parts = trimmed.split(":");
                    if (parts.length > 1) {
                        const num = parseFloat(parts[1]);
                        if (!isNaN(num) && num > 30 && num < 220) {
                            updateMetrics(num);
                        }
                    }
                }

                // 3. Hardware Bulb Status
                if (trimmed.includes("Bulb ON")) setBulbOn(true);
                if (trimmed.includes("Bulb OFF")) setBulbOn(false);
            }
        }
      }
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes("No port selected")) {
        console.log("User cancelled serial connection.");
        return;
      }
      console.error("Serial Connection Error:", error);
      setIsConnected(false);
      alert(`Unable to connect to serial device: ${error instanceof Error ? error.message : errorMsg}`);
    }
  };

  // -- Logic: Simulation Mode --
  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setIsConnected(false);
      setBpm(0);
      setStressLevel('Low');
      setBulbOn(false);
    } else {
      setIsSimulating(true);
      setIsConnected(true);
    }
  };

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        setBpm(prev => {
          const noise = Math.floor(Math.random() * 5) - 2; 
          let newBpm = (prev === 0 ? 75 : prev) + noise;
          
          if (newBpm < 60) newBpm = 60;
          if (newBpm > 130) newBpm = 120;
          
          updateMetrics(newBpm);
          setBulbOn(newBpm >= 80);
          return newBpm;
        });
        // Simulate occasional beat
        setBeatDetected(prev => !prev);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const updateMetrics = (newBpm) => {
    const simulatedHrv = Math.max(20, 100 - (newBpm - 60) * 1.5); 
    setHrv(Math.floor(simulatedHrv));
    setStressLevel(classifyStress(newBpm, simulatedHrv));
  };

  // -- Logic: AI Chat --
  const handleAiChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiLoading(true);

    setTimeout(() => {
        const response = getLocalResponse(userMsg, bpm, stressLevel);
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsAiLoading(false);
    }, 600);
  };

  // Automatic Stress Nudge & Mobile Notification
  useEffect(() => {
    if (stressLevel === 'High' && isConnected) {
       // 1. Send Notification (Mobile/Desktop)
       if (!notificationSent.current && "Notification" in window && Notification.permission === "granted") {
           new Notification("High Stress Detected", {
               body: `BPM is ${bpm}. Take a moment to breathe.`,
               icon: "https://cdn-icons-png.flaticon.com/512/2585/2585592.png"
           });
           notificationSent.current = true;
           // Reset notification trigger after 1 min to avoid spam
           setTimeout(() => notificationSent.current = false, 60000);
       }

       // 2. Chat Nudge
       const timer = setTimeout(() => {
           setMessages(prev => {
               if (prev.length > 0 && prev[prev.length-1].text.includes("high stress")) return prev;
               return [...prev, { role: 'ai', text: "I'm detecting high stress levels. Consider taking a 2-minute breathing break." }]
           });
       }, 5000);
       return () => clearTimeout(timer);
    }
  }, [stressLevel, isConnected, bpm]);

  return (
    <div className="min-h-screen bg-neuro-50 font-sans text-slate-800 pb-12">
      {/* --- Header --- */}
      <header className="bg-white border-b border-neuro-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neuro-500 rounded-lg flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <h1 className="text-2xl font-display font-bold text-neuro-900 tracking-tight">{PROJECT_INFO.title}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Project Group {PROJECT_INFO.groupNo} • {PROJECT_INFO.year}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <button 
               onClick={() => setShowCode(true)}
               className="hidden md:flex px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors items-center"
               title="View Arduino C++ Code"
             >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                View Code
             </button>

             <button 
               onClick={connectSerial}
               disabled={isConnected}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${isConnected && !isSimulating ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>{isConnected && !isSimulating ? 'Connected' : 'Connect Sensor'}</span>
             </button>
             
             <button 
               onClick={toggleSimulation}
               className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isSimulating ? 'bg-neuro-100 text-neuro-700' : 'bg-neuro-600 text-white hover:bg-neuro-700'}`}
             >
                {isSimulating ? 'Stop Sim' : 'Simulate'}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Top Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* 1. Heart Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neuro-100 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
                <div>
                    <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Heart Rate</h2>
                    <div className="flex items-baseline mt-2">
                        <span className="text-6xl font-display font-bold text-neuro-900">{bpm}</span>
                        <span className="ml-2 text-gray-400 text-lg">BPM</span>
                    </div>
                    <div className="mt-4 flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg w-max border border-gray-100">
                        <span className={`w-2.5 h-2.5 rounded-full ${bulbOn ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-gray-300'}`}></span>
                        <span className="text-xs font-medium text-gray-500 uppercase">HW Bulb: {bulbOn ? 'ON' : 'OFF'}</span>
                    </div>
                </div>
                <HeartIcon bpm={bpm} stressLevel={stressLevel} beatDetected={beatDetected} />
            </div>
            <div className="mt-4 h-24 w-full z-10">
                 <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* 2. Stress Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neuro-100 flex flex-col">
             <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-6">Real-time Stress Analysis</h2>
             <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="flex space-x-8">
                    <div className={`flex flex-col items-center transition-all duration-500 ${stressLevel === 'Low' ? 'opacity-100 transform scale-110' : 'opacity-30 grayscale'}`}>
                        <div className="w-16 h-16 rounded-full bg-stress-low shadow-[0_0_20px_rgba(16,185,129,0.5)] mb-2"></div>
                        <span className="font-semibold text-stress-low">Normal</span>
                    </div>
                    <div className={`flex flex-col items-center transition-all duration-500 ${stressLevel === 'Medium' ? 'opacity-100 transform scale-110' : 'opacity-30 grayscale'}`}>
                        <div className="w-16 h-16 rounded-full bg-stress-med shadow-[0_0_20px_rgba(251,191,36,0.5)] mb-2"></div>
                        <span className="font-semibold text-stress-med">Focus</span>
                    </div>
                    <div className={`flex flex-col items-center transition-all duration-500 ${stressLevel === 'High' ? 'opacity-100 transform scale-110' : 'opacity-30 grayscale'}`}>
                        <div className="w-16 h-16 rounded-full bg-stress-high shadow-[0_0_20px_rgba(239,68,68,0.5)] mb-2 animate-pulse"></div>
                        <span className="font-semibold text-stress-high">High</span>
                    </div>
                </div>
                <div className="w-full bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                     <p className="text-gray-600 text-sm">
                       {stressLevel === 'Low' && "You are in a relaxed state. Great for creative work."}
                       {stressLevel === 'Medium' && "Mild engagement detected. Good for focused study."}
                       {stressLevel === 'High' && "Elevated stress detected. Recommended: Take a short break."}
                     </p>
                </div>
             </div>
          </div>

          {/* 3. Toolkit */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neuro-100 flex flex-col">
             <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Wellness Toolkit</h2>
             <div className="space-y-3 flex-1">
                 <button 
                   onClick={() => setShowBreathing(true)}
                   className="w-full py-4 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center transition-all group"
                 >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-xl">🌬️</span>
                    </div>
                    <div className="text-left">
                        <div className="font-bold">Breathing Exercise</div>
                        <div className="text-xs opacity-70">Calm down in 60 seconds</div>
                    </div>
                 </button>

                 <button 
                   onClick={() => {
                      setChatInput("");
                      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
                      setMessages(prev => [...prev, { role: 'ai', text: `💡 Quote of the moment: "${randomQuote}"` }]);
                   }}
                   className="w-full py-4 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex items-center transition-all group"
                 >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-xl">🎵</span>
                    </div>
                    <div className="text-left">
                        <div className="font-bold">Positive Boost</div>
                        <div className="text-xs opacity-70">Get a quick motivation nugget</div>
                    </div>
                 </button>
             </div>
          </div>
        </div>

        {/* --- Chat --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-neuro-100 overflow-hidden flex flex-col md:flex-row h-[500px]">
            <div className="md:w-1/3 bg-neuro-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-display font-bold mb-2">Neurocalm AI Coach</h2>
                    <p className="text-neuro-100 opacity-90">
                        Based on your physiological data, I can help you manage exam stress, anxiety, and workload.
                    </p>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-neuro-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            </div>

            <div className="md:w-2/3 flex flex-col bg-white">
                <div className="flex-1 p-6 overflow-y-auto space-y-4" id="chat-container">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-20">
                            <p>Start a conversation. Try asking:</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                <button onClick={() => setChatInput("I feel overwhelmed by exams.")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition">"I feel overwhelmed"</button>
                                <button onClick={() => setChatInput("How do I improve focus?")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition">"How to focus?"</button>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                msg.role === 'user' 
                                ? 'bg-neuro-600 text-white rounded-br-none' 
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-5 py-3 flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                            placeholder="Type your feelings here..."
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neuro-500 focus:border-transparent"
                        />
                        <button 
                            onClick={handleAiChat}
                            disabled={!chatInput.trim() || isAiLoading}
                            className="bg-neuro-600 text-white px-6 py-3 rounded-xl hover:bg-neuro-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* --- Modals --- */}
      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
      {showCode && <ArduinoCodeModal onClose={() => setShowCode(false)} />}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);