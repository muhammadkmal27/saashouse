"use client";

import { Wallet, TrendingUp, DollarSign, Award, Percent } from "lucide-react";

interface CryptoMetricsProps {
  balance: number;
  capital: number;
  cryptoHoldings: number;
  cryptoValueMYR: number;
  totalNetPnL: number;
  winRate: number;
  wins: number;
  losses: number;
  symbol: string;
}

export default function CryptoMetricsCards({
  balance,
  capital,
  cryptoHoldings,
  cryptoValueMYR,
  totalNetPnL,
  winRate,
  wins,
  losses,
  symbol,
}: CryptoMetricsProps) {
  const totalValue = Number((balance + cryptoValueMYR).toFixed(2));
  const isProfit = totalNetPnL >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* 1. Modal & Baki Dompet */}
      <div className="bg-[#111113] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Wallet size={14} className="text-emerald-400" /> Baki Dompet (MYR)
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Modal Asal: RM{capital}</span>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          RM {balance.toFixed(2)}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          Jumlah Aset Bersih: <span className="font-semibold text-zinc-200">RM {totalValue}</span>
        </p>
      </div>

      {/* 2. Nilai Pegangan Kripto Semasa */}
      <div className="bg-[#111113] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <DollarSign size={14} className="text-purple-400" /> Pegangan {symbol}
          </span>
          <span className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
            Spot
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-purple-300">
          RM {cryptoValueMYR.toFixed(2)}
        </div>
        <p className="text-[11px] text-zinc-500 font-mono mt-1 truncate">
          {cryptoHoldings.toFixed(6)} {symbol.replace('MYR', '')}
        </p>
      </div>

      {/* 3. Untung / Rugi Bersih (Selepas Yuran Luno) */}
      <div className="bg-[#111113] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <TrendingUp size={14} className={isProfit ? "text-emerald-400" : "text-red-400"} /> Untung Bersih (Net)
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Tol. Cas 0.5%
          </span>
        </div>
        <div className={`text-2xl font-bold font-mono ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
          {isProfit ? `+RM ${totalNetPnL.toFixed(2)}` : `-RM ${Math.abs(totalNetPnL).toFixed(2)}`}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          Pulangan: <span className="font-mono font-semibold">{((totalNetPnL / capital) * 100).toFixed(2)}%</span>
        </p>
      </div>

      {/* 4. Kadar Kemenangan (Win Rate) */}
      <div className="bg-[#111113] border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Award size={14} className="text-amber-400" /> Win Rate
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">{wins + losses} Dagangan</span>
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400">
          {winRate.toFixed(1)}%
        </div>
        <p className="text-[11px] text-zinc-400 mt-1 font-mono">
          <span className="text-emerald-400 font-bold">{wins} Menang</span> / <span className="text-red-400 font-bold">{losses} Kalah</span>
        </p>
      </div>
    </div>
  );
}
