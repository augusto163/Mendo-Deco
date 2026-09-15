"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Disc,
  Zap,
  Printer,
  Wrench,
  SlidersHorizontal,
  Plus,
  Check,
  ShieldCheck,
  Coins,
  Receipt,
} from "lucide-react";
import { ConfiguracionCostos, ActivoInversion, ContabilidadResumen, Trabajo } from "../types";
import { InversionModal } from "./InversionModal";

interface FinanzasPanelProps {
  config: ConfiguracionCostos;
  activos: ActivoInversion[];
  contabilidad: ContabilidadResumen;
  trabajos: Trabajo[];
  onSaveConfig: (cfg: Partial<ConfiguracionCostos>) => Promise<void>;
  onSaveActivo: (activo: Partial<ActivoInversion>) => Promise<void>;
  showToast: (msg: string) => void;
}

export const FinanzasPanel: React.FC<FinanzasPanelProps> = ({
  config,
  activos,
  contabilidad,
  trabajos,
  onSaveConfig,
  onSaveActivo,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Editable config state
  const [kwh, setKwh] = useState(config.costo_kwh);
  const [horaOp, setHoraOp] = useState(config.costo_hora_operador);
  const [margenDef, setMargenDef] = useState(config.margen_ganancia_default);
  const [tasaFallo, setTasaFallo] = useState(config.tasa_fallo_default || 5);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onSaveConfig({
        costo_kwh: Number(kwh),
        costo_hora_operador: Number(horaOp),
        margen_ganancia_default: Number(margenDef),
        tasa_fallo_default: Number(tasaFallo),
      });
      showToast("Configuración de tarifas guardada en Supabase.");
    } catch (err: any) {
      alert("Error actualizando tarifas: " + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const totalInversionActivos = activos.reduce((acc, a) => acc + a.costo, 0);

  return (
    <div className="space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Facturación Total Cobrada</span>
          <span className="text-2xl font-black text-white font-mono">
            ${contabilidad.facturacionTotal.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">
            {contabilidad.trabajosCompletadosCount} órdenes finalizadas
          </span>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Costo Operativo Incurrido</span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            ${contabilidad.costoOperativoTotal.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">
            Material, luz, desgaste y operador
          </span>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Ganancia Neta Real</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            +${contabilidad.gananciaNetaTotal.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-500/80 block mt-1 font-semibold">
            Margen promedio: {contabilidad.margenPromedio.toFixed(1)}% s/ venta
          </span>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Retorno de Inversión (ROI)</span>
          <span className="text-2xl font-black text-cyan-400 font-mono">
            {contabilidad.roiPorcentaje.toFixed(1)}%
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">
            Sobre ${contabilidad.inversionTotal.toFixed(2)} en activos
          </span>
        </div>
      </div>

      {/* Main 2-column layout: Cost Breakdown & Config Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Operational Cost Structure */}
        <div className="lg:col-span-7 bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Estructura Real de Costos Operativos
            </h3>
            <span className="text-xs text-zinc-400">Trabajos finalizados</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                <Disc className="w-3.5 h-3.5 text-zinc-400" /> Filamento
              </span>
              <span className="text-base font-bold text-white font-mono">
                ${contabilidad.costoFilamentoTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                {(contabilidad.gramosTotales / 1000).toFixed(2)} kg usados
              </span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricidad
              </span>
              <span className="text-base font-bold text-white font-mono">
                ${contabilidad.costoEnergiaTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">KWh consumidos</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-cyan-400" /> Amortización
              </span>
              <span className="text-base font-bold text-white font-mono">
                ${contabilidad.costoAmortizacionTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">Desgaste flota</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Mano de Obra
              </span>
              <span className="text-base font-bold text-white font-mono">
                ${contabilidad.costoOperadorTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">Operador / taller</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Trazabilidad contable directa: cada trabajo completado alimenta automáticamente este balance.
            </span>
            <span className="font-mono font-bold text-zinc-200">
              Total: ${contabilidad.costoOperativoTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Global Cost Configuration Form */}
        <div className="lg:col-span-5 bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              Tarifas y Parámetros Globales
            </h3>
            <span className="text-xs text-zinc-400">Configuración Granja</span>
          </div>

          <form onSubmit={handleUpdateConfig} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Costo Energía ($/kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={kwh}
                  onChange={(e) => setKwh(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Hora Operador ($/h)
                </label>
                <input
                  type="number"
                  step="10"
                  value={horaOp}
                  onChange={(e) => setHoraOp(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Margen Default (%)
                </label>
                <input
                  type="number"
                  step="5"
                  value={margenDef}
                  onChange={(e) => setMargenDef(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Tasa de Fallo (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={tasaFallo}
                  onChange={(e) => setTasaFallo(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition-colors disabled:opacity-50 mt-2"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSavingConfig ? "Guardando..." : "Guardar Tarifas en Supabase"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Assets / Initial Investments Section */}
      <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Activos de Inversión y Maquinaria
            </h3>
            <p className="text-xs text-zinc-400">
              Total invertido en taller:{" "}
              <strong className="text-white">${totalInversionActivos.toFixed(2)}</strong>
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Activo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {activos.map((activo) => (
            <div
              key={activo.id}
              className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  {activo.categoria}
                </span>
                <h4 className="text-xs font-bold text-zinc-200 mt-0.5">{activo.nombre}</h4>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Costo</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  ${activo.costo.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for new asset */}
      <InversionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSaveActivo}
      />
    </div>
  );
};
