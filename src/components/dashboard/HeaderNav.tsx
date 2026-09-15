"use client";

import React from "react";
import {
  Calculator,
  Printer,
  Disc,
  Layers,
  LineChart,
  Activity,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface HeaderNavProps {
  activeTab: "cotizador" | "flota" | "filamentos" | "produccion" | "finanzas";
  setActiveTab: (tab: "cotizador" | "flota" | "filamentos" | "produccion" | "finanzas") => void;
  isSyncing: boolean;
  onRefresh: () => void;
  jobsEnEjecucionCount: number;
  jobsEnEsperaCount: number;
  lowStockCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  isSyncing,
  onRefresh,
  jobsEnEjecucionCount,
  jobsEnEsperaCount,
  lowStockCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Printer className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg">MendoDeco</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BambuFarm OS v3.5
                </span>
              </div>
              <p className="text-xs text-zinc-400">Control de Producción, AMS & Finanzas</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab("cotizador")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "cotizador"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Cotizador 3D</span>
            </button>

            <button
              onClick={() => setActiveTab("flota")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === "flota"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Flota</span>
              {jobsEnEjecucionCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {jobsEnEjecucionCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("filamentos")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === "filamentos"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Disc className="w-4 h-4" />
              <span>Bobinas</span>
              {lowStockCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("produccion")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === "produccion"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Producción</span>
              {jobsEnEsperaCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {jobsEnEsperaCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("finanzas")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "finanzas"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Finanzas</span>
            </button>
          </nav>

          {/* Status & Sync indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Supabase PostgreSQL</span>
              <span className="sm:hidden">En línea</span>
            </div>

            <button
              onClick={onRefresh}
              title="Refrescar datos de Supabase"
              disabled={isSyncing}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/80 bg-zinc-950/95 py-2 px-1">
        <button
          onClick={() => setActiveTab("cotizador")}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-2 rounded-lg ${
            activeTab === "cotizador" ? "text-emerald-400 font-semibold" : "text-zinc-400"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Cotizador</span>
        </button>
        <button
          onClick={() => setActiveTab("flota")}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-2 rounded-lg ${
            activeTab === "flota" ? "text-emerald-400 font-semibold" : "text-zinc-400"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Flota</span>
        </button>
        <button
          onClick={() => setActiveTab("filamentos")}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-2 rounded-lg ${
            activeTab === "filamentos" ? "text-emerald-400 font-semibold" : "text-zinc-400"
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Bobinas</span>
        </button>
        <button
          onClick={() => setActiveTab("produccion")}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-2 rounded-lg ${
            activeTab === "produccion" ? "text-emerald-400 font-semibold" : "text-zinc-400"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Producción</span>
        </button>
        <button
          onClick={() => setActiveTab("finanzas")}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-2 rounded-lg ${
            activeTab === "finanzas" ? "text-emerald-400 font-semibold" : "text-zinc-400"
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Finanzas</span>
        </button>
      </div>
    </header>
  );
};
