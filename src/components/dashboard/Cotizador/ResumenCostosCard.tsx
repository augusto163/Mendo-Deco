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
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Percent,
} from "lucide-react";
import { PresupuestoCalculadoResponse } from "./types";

interface ResumenCostosCardProps {
  calculo: PresupuestoCalculadoResponse | null;
  isCalculating: boolean;
  marginPercent: number;
  setMarginPercent: (margin: number) => void;
  descuentoPercent: number;
  setDescuentoPercent: (desc: number) => void;
  tiempoTotalMinutos: number;
  tiempoOperadorMinutos: number;
  gramosTotales: number;
  hasSufficientStock: boolean;
  stockDifference: number;
  onCrearCotizacion: () => void;
  isSubmitting: boolean;
  cantidad?: number;
}

export const ResumenCostosCard: React.FC<ResumenCostosCardProps> = ({
  calculo,
  isCalculating,
  marginPercent,
  setMarginPercent,
  descuentoPercent,
  setDescuentoPercent,
  tiempoTotalMinutos,
  tiempoOperadorMinutos,
  gramosTotales,
  hasSufficientStock,
  stockDifference,
  onCrearCotizacion,
  isSubmitting,
  cantidad = 1,
}) => {
  const item = calculo?.items?.[0];

  const costoFilamento = item ? Number(item.costo_filamento_unitario) * cantidad : 0;
  const costoEnergia = item ? Number(item.costo_energia_unitario) * cantidad : 0;
  const costoAmortizacion = item ? Number(item.costo_amortizacion_unitario) * cantidad : 0;
  const costoOperador = item ? Number(item.costo_operador_unitario) * cantidad : 0;
  const costoTotal = calculo ? Number(calculo.costo_total_calculado) : 0;
  const precioSubtotal = calculo ? Number(calculo.precio_subtotal) : 0;
  const precioFinal = calculo ? Number(calculo.precio_final) : 0;
  const unitCost = item ? Number(item.costo_total_unitario) : 0;
  const unitPrice = item ? Number(item.precio_unitario) : 0;
  const netProfit = precioFinal - costoTotal;
  const profitMarginOnSale = precioFinal > 0 ? (netProfit / precioFinal) * 100 : 0;

  const printHours = tiempoTotalMinutos / 60.0;
  const operatorHours = (tiempoOperadorMinutos * cantidad) / 60.0;

  return (
    <div className="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Desglose Oficial del Presupuesto
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-zinc-400">
                {gramosTotales.toFixed(1)}g consumidos • {printHours.toFixed(1)}h de impresión
              </span>
              {cantidad > 1 && (
                <span className="text-[11px] text-amber-400 font-semibold">
                  (x{cantidad} u.)
                </span>
              )}
            </div>
          </div>
          {isCalculating ? (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculando...
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Margen: +{marginPercent}%
            </span>
          )}
        </div>

        {/* Cost items breakdown */}
        <div className="divide-y divide-zinc-800/60 my-4 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Disc className="w-4 h-4 text-zinc-500" /> Filamento ({gramosTotales.toFixed(1)}g)
            </span>
            <span className="font-semibold text-zinc-200">
              ${costoFilamento.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Energía ({printHours.toFixed(1)}h máquina)
            </span>
            <span className="font-semibold text-zinc-200">
              ${costoEnergia.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-500" /> Desgaste / Amortización Máquina
            </span>
            <span className="font-semibold text-zinc-200">
              ${costoAmortizacion.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-400" /> Mano de Obra Operador ({operatorHours.toFixed(2)}h)
            </span>
            <span className="font-semibold text-zinc-200">
              ${costoOperador.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 bg-zinc-950/40 px-3 rounded-xl border border-zinc-800/80 mt-2">
            <div>
              <span className="text-zinc-300 font-medium block">Costo Total de Producción</span>
              {cantidad > 1 && (
                <span className="text-[11px] text-zinc-400 font-mono">
                  ${unitCost.toFixed(2)} por unidad
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-zinc-100">
              ${costoTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Sliders: Margin & Discount */}
        <div className="space-y-4 pt-3 border-t border-zinc-800/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Margen de Ganancia sobre Costo
              </label>
              <span className="text-xs font-bold text-emerald-400">+{marginPercent}%</span>
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
              <span>10% (Al costo)</span>
              <span>150% (Estándar 3D)</span>
              <span>300% (Premium)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> Descuento Comercial
              </label>
              <span className="text-xs font-bold text-amber-400">{descuentoPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={descuentoPercent}
              onChange={(e) => setDescuentoPercent(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Suggested Price & Net Profit Card */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30 space-y-2">
          {descuentoPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-1 border-b border-zinc-800/60">
              <span>Subtotal sin descuento:</span>
              <span className="line-through">${precioSubtotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">
                {cantidad > 1 ? `Precio Final del Lote (x${cantidad} u.)` : "Precio Final de Venta"}
              </span>
              {cantidad > 1 && (
                <span className="text-xs text-emerald-400/90 font-mono font-bold">
                  ${(precioFinal / (cantidad || 1)).toFixed(2)} / unidad
                </span>
              )}
            </div>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              ${precioFinal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
            <span className="text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Ganancia Neta {cantidad > 1 ? `Total` : ""}
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
              Atención: Stock en taller inferior al estimado (faltan {Math.abs(stockDifference)}g).
            </span>
          </div>
        )}

        <button
          onClick={onCrearCotizacion}
          disabled={isSubmitting || isCalculating}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando cotización...
            </span>
          ) : (
            <>
              <FileCheck className="w-4 h-4" />
              <span>Guardar Cotización Oficial (Borrador)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
