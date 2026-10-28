"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AutopilotControls from "@/components/crypto-autopilot/AutopilotControls";
import CryptoMetricsCards from "@/components/crypto-autopilot/CryptoMetricsCards";
import CryptoLiveChart from "@/components/crypto-autopilot/CryptoLiveChart";
import AiReasoningFeed from "@/components/crypto-autopilot/AiReasoningFeed";
import CryptoTradeLogs from "@/components/crypto-autopilot/CryptoTradeLogs";
import { getAutopilot, postAutopilot } from "@/utils/autopilot-api";
import { ShieldCheck, Sparkles, RefreshCw, Key, Check, Eye, EyeOff } from "lucide-react";
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
  const [apiKeyInfo, setApiKeyInfo] = useState<{ hasKey: boolean; maskedKey: string }>({ hasKey: false, maskedKey: "" });
  const [keyInput, setKeyInput] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [keyMsg, setKeyMsg] = useState("");
  const isRunningRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getAutopilot<any>("/api/ai/crypto/status");
      setStatus(data);
      isRunningRef.current = data.isRunning;
    } catch {}
  }, []);

  const fetchApiKey = useCallback(async () => {
    try {
      const data = await getAutopilot<any>("/api/ai/crypto/config/apikey");
      setApiKeyInfo(data);
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
    fetchApiKey();
    fetchCandles();
  }, [fetchStatus, fetchApiKey, fetchCandles]);

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

  const handleSaveApiKey = async () => {
    if (!keyInput.trim().startsWith("sk-")) {
      alert("Kunci API mestilah bermula dengan 'sk-'");
      return;
    }
    try {
      const res = await postAutopilot<any>("/api/ai/crypto/config/apikey", { apiKey: keyInput });
      setApiKeyInfo(res);
      setKeyInput("");
      setKeyMsg("Kunci API berjaya disimpan ke pelayan!");
      setTimeout(() => setKeyMsg(""), 4000);
    } catch (e: any) {
      alert("Gagal simpan Kunci API: " + e.message);
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
            onClick={() => setShowKeyPanel(!showKeyPanel)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-500/30 transition shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>{apiKeyInfo.hasKey ? apiKeyInfo.maskedKey : "Tetapan Kunci API"}</span>
          </button>
          <button
            onClick={() => { fetchStatus(); fetchApiKey(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <T en="Refresh" bm="Muat Semula" />
          </button>
        </div>
      </div>

      {/* Dynamic API Key Configuration Drawer */}
      {showKeyPanel && (
        <div className="bg-[#141418] border border-purple-500/30 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Kunci API DeepSeek (AI Engine)
                {apiKeyInfo.hasKey && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">Aktif: {apiKeyInfo.maskedKey}</span>}
              </h4>
              <p className="text-xs text-zinc-400">Tuan boleh kemas kini kunci API DeepSeek terus dari sini tanpa perlu SSH ke pelayan.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type={showSecret ? "text" : "password"}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
          {keyMsg && <p className="text-xs text-emerald-400 font-semibold w-full">{keyMsg}</p>}
        </div>
      )}

      {/* Control Panel */}
      <AutopilotControls
        isRunning={status.isRunning}
        symbol={symbol}
        onSelectSymbol={(sym) => { setSymbol(sym); fetchCandles(); }}
        capital={capital}
        onChangeCapital={setCapital}
        onStart={handleStart}
        onStop={handleStop}
        onTriggerOptimize={async () => {
          setIsOptimizing(true);
          try {
            const res = await getAutopilot<any>("/api/ai/crypto/reasoning", { symbol });
            setMarketAnalysis(res);
            await fetchStatus();
          } catch (e: any) {
            alert("Ralat analisis AI: " + e.message);
          } finally {
            setIsOptimizing(false);
          }
        }}
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
