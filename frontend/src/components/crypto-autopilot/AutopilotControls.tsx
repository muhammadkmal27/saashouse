"use client";

import { Play, Square, Sparkles, RefreshCw, Bot, ShieldCheck } from "lucide-react";

interface ControlsProps {
  isRunning: boolean;
  symbol: string;
  onSelectSymbol: (sym: string) => void;
  capital: number;
  onChangeCapital: (val: number) => void;
  onStart: () => void;
  onStop: () => void;
  onTriggerOptimize: () => void;
  isOptimizing: boolean;
  currentPrice: number;
}

export default function AutopilotControls({
  isRunning,
  symbol,
  onSelectSymbol,
  capital,
  onChangeCapital,
  onStart,
  onStop,
  onTriggerOptimize,
  isOptimizing,
  currentPrice,
}: ControlsProps) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Coin Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">Pilihan Kripto:</span>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { id: "XBTMYR", label: "Bitcoin (BTC)" },
              { id: "SOLMYR", label: "Solana (SOL)" },
              { id: "ETHMYR", label: "Ethereum (ETH)" },
            ].map((coin) => (
              <button
                key={coin.id}
                disabled={isRunning}
                onClick={() => onSelectSymbol(coin.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  symbol === coin.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                    : "text-zinc-400 hover:text-white"
                } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {coin.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Price Tag */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-xs">
          <span className="text-zinc-500">Harga Semasa:</span>
          <span className="text-emerald-400 font-bold">
            RM {currentPrice > 0 ? currentPrice.toLocaleString() : "..."}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-850">
        {/* Capital Input */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-400">Modal Masuk:</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-xs font-bold text-zinc-500">RM</span>
            <input
              type="number"
              min="10"
              max="10000"
              value={capital}
              disabled={isRunning}
              onChange={(e) => onChangeCapital(Number(e.target.value))}
              className={`w-28 bg-zinc-950 border border-zinc-700 text-white pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500 ${
                isRunning ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </div>
          <span className="text-[11px] text-zinc-500">(Cas Broker Luno 0.5% ditolak automatik)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerOptimize}
            disabled={isOptimizing}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-purple-500/50 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Bot size={14} className={isOptimizing ? "animate-spin text-purple-400" : "text-purple-400"} />
            {isOptimizing ? "DeepSeek Mengoptimumkan..." : "Optimumkan AI"}
          </button>

          {!isRunning ? (
            <button
              onClick={onStart}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:scale-105 transition transform active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              MULA AUTOPILOT AI (RM{capital})
            </button>
          ) : (
            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 transition transform active:scale-95 animate-pulse"
            >
              <Square size={14} fill="currentColor" />
              HENTIKAN AUTOPILOT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
