"use client";

import React, { useState } from "react";
import {
  Printer,
  Plus,
  Zap,
  Clock,
  Activity,
  Wrench,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Edit3,
} from "lucide-react";
import { Impresora, Trabajo } from "../types";
import { ImpresoraModal } from "./ImpresoraModal";

interface FlotaPanelProps {
  printers: Impresora[];
  trabajos: Trabajo[];
  onSavePrinter: (printerData: Partial<Impresora>) => Promise<void>;
  onDeletePrinter: (id: number) => Promise<void>;
  showToast: (msg: string) => void;
}

export const FlotaPanel: React.FC<FlotaPanelProps> = ({
  printers,
  trabajos,
  onSavePrinter,
  onDeletePrinter,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Impresora | null>(null);

  const printingCount = printers.filter((p) => p.estado === "IMPRIMIENDO").length;
  const availableCount = printers.filter((p) => p.estado === "DISPONIBLE" || !p.estado).length;
  const maintenanceCount = printers.filter((p) => p.estado === "MANTENIMIENTO").length;

  const handleOpenCreate = () => {
    setSelectedPrinter(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (printer: Impresora) => {
    setSelectedPrinter(printer);
    setModalOpen(true);
  };

  const handleToggleMantenimiento = async (printer: Impresora) => {
    const nuevoEstado = printer.estado === "MANTENIMIENTO" ? "DISPONIBLE" : "MANTENIMIENTO";
    await onSavePrinter({ id: printer.id, estado: nuevoEstado });
    showToast(`Estado de "${printer.nombre}" actualizado a ${nuevoEstado}.`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Flota Total</span>
          <span className="text-2xl font-black text-white">{printers.length}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Máquinas registradas</span>
        </div>

        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">En Producción</span>
          <span className="text-2xl font-black text-amber-400">{printingCount}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Imprimiendo ahora</span>
        </div>

        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Disponibles</span>
          <span className="text-2xl font-black text-emerald-400">{availableCount}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">Listas para trabajar</span>
        </div>

        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-400 block mb-1">Mantenimiento</span>
          <span className="text-2xl font-black text-rose-400">{maintenanceCount}</span>
          <span className="text-[11px] text-zinc-500 block mt-1">En calibración / service</span>
        </div>
      </div>

      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gestión y Monitoreo de Flota 3D
          </h2>
          <p className="text-xs text-zinc-400">
            Máquinas sincronizadas en Supabase con cálculo de desgaste y amortización por hora.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Impresora</span>
        </button>
      </div>

      {/* Grid of Printers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map((printer) => {
          // Find active job assigned to this printer
          const activeJob = trabajos.find(
            (t) => t.impresoraId === printer.id && t.estado === "ejecucion"
          );

          const isPrinting = printer.estado === "IMPRIMIENDO" || Boolean(activeJob);
          const isMaintenance = printer.estado === "MANTENIMIENTO";
          const amortPerHour = printer.costo_maquina / (printer.horas_vida_util || 8000);
          const usedHours = printer.horas_uso_actual || 0;
          const lifeProgress = Math.min(100, Math.round((usedHours / (printer.horas_vida_util || 8000)) * 100));

          return (
            <div
              key={printer.id}
              className={`bg-zinc-900/90 rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-lg ${
                isPrinting
                  ? "border-amber-500/40 shadow-amber-500/5"
                  : isMaintenance
                  ? "border-rose-500/40 bg-rose-950/10"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-inner ${
                        isPrinting
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : isMaintenance
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      <Printer className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                        {printer.nombre}
                      </h3>
                      <span className="text-[11px] text-zinc-400 block">
                        {printer.modelo || "Bambu Lab"}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      isPrinting
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : isMaintenance
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {isPrinting ? "Imprimiendo" : isMaintenance ? "Mantenimiento" : "Disponible"}
                  </span>
                </div>

                {/* Active print details if printing */}
                {isPrinting && activeJob && (
                  <div className="my-3 p-3 rounded-xl bg-zinc-950/70 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1.5 truncate max-w-[200px]">
                        <FileCode className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{activeJob.nombre}</span>
                      </span>
                      <span className="font-bold text-amber-400">
                        {activeJob.progresoPorcentaje || 0}%
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${activeJob.progresoPorcentaje || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Cliente: {activeJob.cliente}</span>
                      <span>
                        Tiempo: {activeJob.tiempoTranscurridoMin}/{activeJob.tiempoMinutos} min
                      </span>
                    </div>
                  </div>
                )}

                {/* Machine technical details */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Consumo Eléctrico</span>
                    <span className="font-semibold text-zinc-200 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {printer.consumo_kw} kW
                    </span>
                  </div>

                  <div className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Amortización / Hora</span>
                    <span className="font-semibold text-zinc-200">
                      ${amortPerHour.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Life hours meter */}
                <div className="space-y-1 my-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Horas acumuladas</span>
                    <span className="font-medium text-zinc-200">
                      {usedHours.toFixed(0)} / {printer.horas_vida_util || 8000} h ({lifeProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full ${
                        lifeProgress > 85 ? "bg-rose-500" : lifeProgress > 60 ? "bg-amber-500" : "bg-cyan-500"
                      }`}
                      style={{ width: `${lifeProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleMantenimiento(printer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isMaintenance
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isMaintenance ? "Reactivar" : "Mantenimiento"}</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(printer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-medium transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printer Modal */}
      <ImpresoraModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        impresora={selectedPrinter}
        onSave={onSavePrinter}
        onDelete={onDeletePrinter}
      />
    </div>
  );
};
