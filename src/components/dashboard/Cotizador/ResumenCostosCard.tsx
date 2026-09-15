"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  Zap,
  Clock,
  Printer,
  Wrench,
  Disc,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface ResumenCostosCardProps {
  costFilament: number;
  costElectricity: number;
  costMachine: number;
  costLabor: number;
  totalCost: number;
  suggestedPrice: number;
  netProfit: number;
  marginPercent: number;
  setMarginPercent: (margin: number) => void;
  printHours: number;
  operatorHours: number;
  hasSufficientStock: boolean;
  stockDifference: number;
  onConfirmOrder: () => void;
  isSubmitting: boolean;
}

export const ResumenCostosCard: React.FC<ResumenCostosCardProps> = ({
  costFilament,
  costElectricity,
  costMachine,
  costLabor,
  totalCost,
  suggestedPrice,
  netProfit,
  marginPercent,
  setMarginPercent,
  printHours,
  operatorHours,
  hasSufficientStock,
  stockDifference,
  onConfirmOrder,
  isSubmitting,
}) => {
  const profitMarginOnSale = suggestedPrice > 0 ? (netProfit / suggestedPrice) * 100 : 0;

  return (
    <div className="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Desglose Financiero & Cotización
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            Margen: +{marginPercent}%
          </span>
        </div>

        {/* Cost items breakdown */}
        <div className="divide-y divide-zinc-800/60 my-4 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Disc className="w-4 h-4 text-zinc-500" /> Filamento Total
            </span>
            <span className="font-semibold text-zinc-200">${costFilament.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Energía ({printHours.toFixed(1)}h de impresión)
            </span>
            <span className="font-semibold text-zinc-200">${costElectricity.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-500" /> Desgaste / Amortización Máquina
            </span>
            <span className="font-semibold text-zinc-200">${costMachine.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-400" /> Mano de Obra ({operatorHours.toFixed(2)}h op.)
            </span>
            <span className="font-semibold text-zinc-200">${costLabor.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between py-3 bg-zinc-950/40 px-3 rounded-xl border border-zinc-800/80 mt-2">
            <span className="text-zinc-300 font-medium">Costo Total de Producción</span>
            <span className="text-sm font-bold text-zinc-100">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Margin Slider */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-300">
              Margen de Ganancia Deseado
            </label>
            <span className="text-xs font-bold text-emerald-400">{marginPercent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="300"
            step="5"
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>10% (Costo)</span>
            <span>150% (Estándar 3D)</span>
            <span>300% (Premium)</span>
          </div>
        </div>

        {/* Suggested Price & Net Profit Card */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400">Precio Sugerido de Venta</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              ${suggestedPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
            <span className="text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Ganancia Neta
            </span>
            <span className="font-bold text-emerald-300">
              +${netProfit.toFixed(2)} ({profitMarginOnSale.toFixed(0)}% s/ venta)
            </span>
          </div>
        </div>
      </div>

      {/* Stock warning & Submit button */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        {!hasSufficientStock && (
          <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Atención: No hay suficiente stock en las bobinas seleccionadas (faltan {Math.abs(stockDifference)}g).
            </span>
          </div>
        )}

        <button
          onClick={onConfirmOrder}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Registrando orden...</span>
          ) : (
            <>
              <span>Registrar Orden y Enviar a Producción</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
