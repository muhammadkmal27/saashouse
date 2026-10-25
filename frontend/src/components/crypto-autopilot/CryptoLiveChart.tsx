"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

interface LiveChartProps {
  candles: any[];
  symbol: string;
  currentPrice: number;
}

export default function CryptoLiveChart({ candles = [], symbol, currentPrice }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#09090b" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#18181b" }, horzLines: { color: "#18181b" } },
      crosshair: { mode: 1 },
      timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 320,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () =>
      chartRef.current?.applyOptions({ width: containerRef.current?.clientWidth || 0 });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0) {
      candleSeriesRef.current.setData(candles as any);
      volumeSeriesRef.current?.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.volume || 1,
          color: c.close >= c.open ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
        })) as any
      );
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles]);

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4 space-y-2 relative overflow-hidden">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{symbol} / MYR</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
            Lilin 1-Minit Masa Nyata (Binance / Luno Feed)
          </span>
        </div>
        <div className="font-bold text-emerald-400">
          RM {currentPrice > 0 ? currentPrice.toLocaleString() : "..."}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[320px]" />
    </div>
  );
}
