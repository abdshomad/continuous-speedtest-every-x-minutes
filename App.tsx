import React, { useState, useEffect, useCallback, useRef } from 'react';
import { runSpeedTest } from './services/speedTest';
import { getNetworkInsights } from './services/geminiService';
import { SpeedResult, NetworkInsight } from './types';
import StatCard from './components/StatCard';
import HistoryChart from './components/HistoryChart';

const TEST_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const App: React.FC = () => {
  const [history, setHistory] = useState<SpeedResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [insights, setInsights] = useState<NetworkInsight | null>(null);
  const [nextRun, setNextRun] = useState<number>(Date.now() + TEST_INTERVAL_MS);
  const [timeLeft, setTimeLeft] = useState<number>(TEST_INTERVAL_MS);

  // Persistence: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('omnispeed_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('omnispeed_history', JSON.stringify(history.slice(-100))); // Keep last 100
  }, [history]);

  const performTest = useCallback(async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      const result = await runSpeedTest();
      setHistory(prev => [...prev, result]);
      setNextRun(Date.now() + TEST_INTERVAL_MS);
      
      // Get AI insights after a new test (if we have a few data points)
      const currentHistory = [...history, result];
      if (currentHistory.length >= 1) {
        const aiResponse = await getNetworkInsights(currentHistory);
        setInsights(aiResponse);
      }
    } catch (err) {
      console.error("Speed test failed", err);
    } finally {
      setIsTesting(false);
    }
  }, [history, isTesting]);

  // Initial test on load
  useEffect(() => {
    performTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, nextRun - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        performTest();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRun, performTest]);

  const formatTimeRemaining = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentResult = history[history.length - 1];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {isTesting && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full pulse-animation" />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              OmniSpeed
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Next automated test</span>
              <span className="font-mono text-indigo-400">{formatTimeRemaining(timeLeft)}</span>
            </div>
            <button 
              onClick={performTest}
              disabled={isTesting}
              className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                isTesting 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
              }`}
            >
              {isTesting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : 'Run Now'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Download" 
            value={currentResult?.download || '---'} 
            unit="Mbps" 
            colorClass="text-indigo-400 bg-indigo-500"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>}
          />
          <StatCard 
            label="Upload" 
            value={currentResult?.upload || '---'} 
            unit="Mbps" 
            colorClass="text-pink-400 bg-pink-500"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
          />
          <StatCard 
            label="Latency" 
            value={currentResult?.latency || '---'} 
            unit="ms" 
            colorClass="text-emerald-400 bg-emerald-500"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard 
            label="Jitter" 
            value={currentResult?.jitter || '---'} 
            unit="ms" 
            colorClass="text-amber-400 bg-amber-500"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Performance History</h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Download
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span> Upload
                </span>
              </div>
            </div>
            {history.length > 0 ? (
              <HistoryChart data={history} />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Waiting for first measurement...</p>
              </div>
            )}
          </div>

          {/* AI Insights & Recent Logs */}
          <div className="space-y-8">
            {/* AI Analyzer */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3">
                 <div className={`w-3 h-3 rounded-full ${
                   insights?.status === 'excellent' ? 'bg-emerald-500' : 
                   insights?.status === 'good' ? 'bg-indigo-500' :
                   insights?.status === 'fair' ? 'bg-amber-500' : 'bg-rose-500'
                 } shadow-lg shadow-current/20`} />
              </div>
              
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Network Insights
              </h3>

              {insights ? (
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed italic">"{insights.summary}"</p>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommendations</h4>
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-400">
                          <span className="text-indigo-500 font-bold">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Logs List */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Recent Tests</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {[...history].reverse().slice(0, 10).map((log, i) => (
                  <div key={log.timestamp} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-700/50">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-indigo-400">{log.download}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Down</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-pink-400">{log.upload}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Up</span>
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center text-slate-600 py-4 text-sm">No tests recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-12 text-center text-slate-600 text-xs">
        <p>© {new Date().getFullYear()} OmniSpeed Continuous Network Monitor. Local monitoring active.</p>
        <p className="mt-1">Powered by Google Gemini for Performance Analysis</p>
      </footer>
    </div>
  );
};

export default App;