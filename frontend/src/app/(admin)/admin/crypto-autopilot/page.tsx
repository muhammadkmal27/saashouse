"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AutopilotControls from "@/components/crypto-autopilot/AutopilotControls";
import CryptoMetricsCards from "@/components/crypto-autopilot/CryptoMetricsCards";
import CryptoLiveChart from "@/components/crypto-autopilot/CryptoLiveChart";
import AiReasoningFeed from "@/components/crypto-autopilot/AiReasoningFeed";
import CryptoTradeLogs from "@/components/crypto-autopilot/CryptoTradeLogs";
import { getAutopilot, postAutopilot } from "@/utils/autopilot-api";
import { ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { T } from "@/components/Translate";

export default function AdminCryptoAutopilotPage() {
  const [symbol, setSymbol] = useState("XBTMYR");
  const [capital, setCapital] = useState(100);
  const [status, setStatus] = useState<any>({
    isRunning: false,
    symbol: "XBTMYR",
    capital: 100,
    balance: 100,
    cryptoHoldings: 0,
    cryptoValueMYR: 0,
    totalNetPnL: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    openPosition: null,
    trades: [],
    parameters: { takeProfitPct: 2.2, stopLossPct: 1.5, rsiThreshold: 35, gridSpreadPct: 1.2 },
    aiReflectionLogs: [],
    lastPrice: 358000,
  });

  const [candles, setCandles] = useState<any[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const isRunningRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getAutopilot<any>("/api/ai/crypto/status");
      setStatus(data);
      isRunningRef.current = data.isRunning;
    } catch {}
  }, []);

  const fetchCandles = useCallback(async () => {
    try {
      const data = await getAutopilot<any>("/api/ai/crypto/candles", { symbol, limit: "60" });
      setCandles(data.candles || []);
      return data.currentPrice;
    } catch {
      return 0;
    }
  }, [symbol]);

  useEffect(() => {
    fetchStatus();
    fetchCandles();
  }, [fetchStatus, fetchCandles]);

  useEffect(() => {
    const statusInterval = setInterval(fetchStatus, 3000);
    const candleInterval = setInterval(fetchCandles, 5000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(candleInterval);
    };
  }, [fetchStatus, fetchCandles]);

  const handleStart = async () => {
    try {
      const res = await postAutopilot<any>("/api/ai/crypto/start", { symbol, initialCapital: capital });
      setStatus(res.status);
      isRunningRef.current = true;
    } catch (e: any) {
      alert("Gagal mulakan Autopilot: " + e.message);
    }
  };

  const handleStop = async () => {
    try {
      const res = await postAutopilot<any>("/api/ai/crypto/stop");
      setStatus(res.status);
      isRunningRef.current = false;
    } catch (e: any) {
      alert("Gagal hentikan Autopilot: " + e.message);
    }
  };

  const handleTriggerOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await getAutopilot<any>("/api/ai/crypto/reasoning", { symbol });
      setMarketAnalysis(res);
      await fetchStatus();
    } catch (e: any) {
      alert("Gagal jalankan AI Analisis: " + e.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Confidential Admin Zone */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-purple-950/40 to-zinc-900 border border-purple-500/20 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> <T en="PRIVATE ADMIN ACCESS ONLY" bm="AKSES KHAS ADMIN SAHAJA" />
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 24/7 Cloud Daemon
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Crypto DeepSeek AI Autopilot <Sparkles className="w-5 h-5 text-purple-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            <T 
              en="Autonomous 24/7 spot crypto trading engine running live on imat.my production server with DeepSeek self-optimizing feedback loop."
              bm="Enjin dagangan spot kripto autonomi 24 jam di pelayan produksi imat.my dilengkapi pembelajaran kendiri DeepSeek AI."
            />
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <T en="Refresh" bm="Muat Semula" />
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <AutopilotControls
        isRunning={status.isRunning}
        symbol={symbol}
        onSelectSymbol={(sym) => { setSymbol(sym); fetchCandles(); }}
        capital={capital}
        onChangeCapital={setCapital}
        onStart={handleStart}
        onStop={handleStop}
        onTriggerOptimize={handleTriggerOptimize}
        isOptimizing={isOptimizing}
        currentPrice={status.lastPrice}
      />

      {/* Metrics Row */}
      <CryptoMetricsCards
        balance={status.balance || 0}
        capital={status.capital || 100}
        cryptoHoldings={status.cryptoHoldings || 0}
        cryptoValueMYR={status.cryptoValueMYR || 0}
        totalNetPnL={status.totalNetPnL || 0}
        winRate={status.winRate || 0}
        wins={status.wins || 0}
        losses={status.losses || 0}
        symbol={status.symbol || symbol}
      />

      {/* Live Real-time Chart */}
      <CryptoLiveChart
        candles={candles}
        symbol={symbol}
        currentPrice={status.lastPrice}
      />

      {/* AI Reasoning & Trade Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AiReasoningFeed
          parameters={status.parameters}
          reflectionLogs={status.aiReflectionLogs}
          marketAnalysis={marketAnalysis}
        />
        <CryptoTradeLogs
          trades={status.trades}
          openPosition={status.openPosition}
        />
      </div>
    </div>
  );
}
