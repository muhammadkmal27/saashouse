"use client";

import { Bot, Sparkles, Brain, Cpu, Clock, CheckCircle } from "lucide-react";

interface AiReasoningProps {
  parameters: {
    takeProfitPct: number;
    stopLossPct: number;
    rsiThreshold: number;
    gridSpreadPct: number;
  };
  reflectionLogs: { timestamp: string; note: string; parameters: any }[];
  marketAnalysis?: {
    regime: string;
    signal: string;
    confidence: number;
    reason: string;
  } | null;
}

export default function AiReasoningFeed({
  parameters,
  reflectionLogs = [],
  marketAnalysis,
}: AiReasoningProps) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Minda AI DeepSeek
              <span className="text-[10px] bg-purple-500/15 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/30">
                Self-Improving Agent
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500">Penaakulan matematik kendiri &amp; penyerapan yuran Luno 0.5%</p>
          </div>
        </div>

        {/* Live Parameters Badges */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
          <span className="bg-zinc-950 border border-zinc-800 text-emerald-400 px-2 py-1 rounded-lg">
            TP: +{parameters.takeProfitPct}%
          </span>
          <span className="bg-zinc-950 border border-zinc-800 text-red-400 px-2 py-1 rounded-lg">
            SL: -{parameters.stopLossPct}%
          </span>
          <span className="bg-zinc-950 border border-zinc-800 text-purple-400 px-2 py-1 rounded-lg">
            Grid: {parameters.gridSpreadPct}%
          </span>
        </div>
      </div>

      {/* Market Regime Card (DeepSeek Analysis) */}
      {marketAnalysis && (
        <div className="bg-gradient-to-r from-purple-950/20 to-zinc-950 p-3.5 rounded-xl border border-purple-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-300 font-bold flex items-center gap-1">
              <Brain size={14} /> Rejim: {marketAnalysis.regime}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              Keyakinan: {marketAnalysis.confidence}%
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed italic">
            &ldquo;{marketAnalysis.reason}&rdquo;
          </p>
        </div>
      )}

      {/* Self-Reflection Timeline */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" /> Log Adaptasi Kendiri DeepSeek:
        </span>
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
          {reflectionLogs.length === 0 ? (
            <p className="text-zinc-600 text-[11px]">Menunggu transaksi pertama untuk penilaian AI...</p>
          ) : (
            reflectionLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-xl space-y-1 text-[11px]"
              >
                <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-purple-400 font-semibold">Auto-Tuned</span>
                </div>
                <p className="text-zinc-300 font-sans leading-snug">{log.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
