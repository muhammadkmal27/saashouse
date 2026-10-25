"use client";

import { Receipt, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export interface CryptoTradeItem {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number;
  units: number;
  cost: number;
  buyFee: number;
  sellFee?: number;
  grossPnL?: number;
  netPnL?: number;
  netPnLPct?: number;
  status: "OPEN" | "WIN" | "LOSS";
  timestamp: string;
  exitTimestamp?: string;
  reason: string;
}

interface TradeLogsProps {
  trades: CryptoTradeItem[];
  openPosition?: CryptoTradeItem | null;
}

export default function CryptoTradeLogs({ trades = [], openPosition }: TradeLogsProps) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt size={16} className="text-emerald-400" />
          Resit Log Transaksi Nyata (Kira Yuran Luno 0.5%)
        </h3>
        <span className="text-[11px] text-zinc-500 font-mono">
          {trades.length} Rekod Selesai
        </span>
      </div>

      {/* Open Position Banner if currently in position */}
      {openPosition && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-400">POSISI SEMASA AKTIF:</span>
            <span className="text-white">Beli @ RM {openPosition.entryPrice.toLocaleString()}</span>
            <span className="text-zinc-400">({openPosition.units} {openPosition.symbol.replace("MYR", "")})</span>
          </div>
          <div className="text-zinc-400 text-[11px]">
            Modal: RM {openPosition.cost.toFixed(2)} | Cas Beli: RM {openPosition.buyFee.toFixed(2)} (0.5%)
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px]">
              <th className="pb-2.5">Waktu</th>
              <th className="pb-2.5">Koin</th>
              <th className="pb-2.5">Harga Masuk</th>
              <th className="pb-2.5">Harga Keluar</th>
              <th className="pb-2.5">Yuran Luno (0.5%)</th>
              <th className="pb-2.5 text-right">Untung Bersih (Net)</th>
              <th className="pb-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {trades.length === 0 && !openPosition ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600 font-sans text-xs">
                  Belum ada transaksi. Tekan butang &ldquo;MULA AUTOPILOT AI&rdquo; untuk mula berdagang secara langsung!
                </td>
              </tr>
            ) : (
              trades.map((t) => {
                const totalFee = (t.buyFee || 0) + (t.sellFee || 0);
                const isWin = t.status === "WIN";

                return (
                  <tr key={t.id} className="hover:bg-zinc-900/50 transition">
                    <td className="py-2.5 text-zinc-400 text-[11px]">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 font-bold text-white">{t.symbol}</td>
                    <td className="py-2.5 text-zinc-300">RM {t.entryPrice.toLocaleString()}</td>
                    <td className="py-2.5 text-zinc-300">
                      {t.exitPrice ? `RM ${t.exitPrice.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-2.5 text-zinc-400 text-[11px]">
                      RM {totalFee.toFixed(3)}
                    </td>
                    <td className={`py-2.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                      {t.netPnL !== undefined
                        ? `${t.netPnL >= 0 ? "+" : ""}RM ${t.netPnL.toFixed(2)} (${t.netPnLPct}%)`
                        : "-"}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {isWin ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
