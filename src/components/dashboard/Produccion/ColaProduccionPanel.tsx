"use client";

import React, { useState } from "react";
import {
  Layers,
  Play,
  CheckCircle2,
  Clock,
  Printer,
  Disc,
  Trash2,
  FileCode,
  User,
  ArrowRight,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Trabajo, Impresora } from "../types";
import { DetalleTrabajoModal } from "./DetalleTrabajoModal";

interface ColaProduccionPanelProps {
  trabajos: Trabajo[];
  printers: Impresora[];
  onIniciarTrabajo: (jobId: number, printerId?: number) => Promise<void>;
  onCompletarTrabajo: (jobId: number) => Promise<void>;
  onCancelarTrabajo: (jobId: number) => Promise<void>;
  showToast: (msg: string) => void;
}

export const ColaProduccionPanel: React.FC<ColaProduccionPanelProps> = ({
  trabajos,
  printers,
  onIniciarTrabajo,
  onCompletarTrabajo,
  onCancelarTrabajo,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"todas" | "espera" | "ejecucion" | "completado">("todas");
  const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<number | null>(null);

  const enEspera = trabajos.filter((t) => t.estado === "espera");
  const enEjecucion = trabajos.filter((t) => t.estado === "ejecucion");
  const completados = trabajos.filter((t) => t.estado === "completado");

  const filtered =
    activeSubTab === "espera"
      ? enEspera
      : activeSubTab === "ejecucion"
      ? enEjecucion
      : activeSubTab === "completado"
      ? completados
      : trabajos;

  const handleIniciar = async (job: Trabajo) => {
    setIsProcessingId(job.id);
    try {
      await onIniciarTrabajo(job.id);
    } catch (err: any) {
      alert("Error iniciando trabajo: " + err.message);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleCompletar = async (job: Trabajo) => {
    if (confirm(`¿Marcar "${job.nombre}" como completado?\nSe descontará automáticamente el filamento usado del inventario en Supabase.`)) {
      setIsProcessingId(job.id);
      try {
        await onCompletarTrabajo(job.id);
      } catch (err: any) {
        alert("Error al completar trabajo: " + err.message);
      } finally {
        setIsProcessingId(null);
      }
    }
  };

  const handleCancelar = async (job: Trabajo) => {
    if (confirm(`¿Cancelar y eliminar la orden "${job.nombre}"?`)) {
      setIsProcessingId(job.id);
      try {
        await onCancelarTrabajo(job.id);
      } catch (err: any) {
        alert("Error al cancelar trabajo: " + err.message);
      } finally {
        setIsProcessingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">En Espera de Impresión</span>
            <span className="text-2xl font-black text-blue-400">{enEspera.length}</span>
            <span className="text-[11px] text-zinc-500 block mt-1">Órdenes en cola</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Imprimiendo Ahora</span>
            <span className="text-2xl font-black text-amber-400">{enEjecucion.length}</span>
            <span className="text-[11px] text-zinc-500 block mt-1">Máquinas activas</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Total Completados</span>
            <span className="text-2xl font-black text-emerald-400">{completados.length}</span>
            <span className="text-[11px] text-zinc-500 block mt-1">Piezas finalizadas</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("todas")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeSubTab === "todas"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Todas ({trabajos.length})
          </button>
          <button
            onClick={() => setActiveSubTab("ejecucion")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "ejecucion"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>En Ejecución ({enEjecucion.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("espera")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "espera"
                ? "bg-blue-500 text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>En Espera ({enEspera.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("completado")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === "completado"
                ? "bg-emerald-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Completados ({completados.length})</span>
          </button>
        </div>
      </div>

      {/* Jobs List / Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs">
            No hay trabajos en esta sección.
          </div>
        ) : (
          filtered.map((job) => {
            const isRunning = job.estado === "ejecucion";
            const isCompleted = job.estado === "completado";
            const isPending = job.estado === "espera";
            const isProcessing = isProcessingId === job.id;

            return (
              <div
                key={job.id}
                className={`bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                  isRunning
                    ? "border-amber-500/40 bg-zinc-900/95"
                    : isCompleted
                    ? "border-emerald-500/20"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Left: Code, Name, Client, Printer */}
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border flex-shrink-0 ${
                      isRunning
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    <FileCode className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        {job.codigo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isRunning
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {isRunning ? "Imprimiendo" : isCompleted ? "Completado" : "En Espera"}
                      </span>
                      <span className="text-[10px] text-zinc-500 hidden sm:inline">
                        {job.fecha}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{job.nombre}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        {job.cliente}
                      </span>
                      <span className="flex items-center gap-1">
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        {job.impresoraNombre || "Auto"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {job.tiempoMinutos} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Disc className="w-3.5 h-3.5 text-indigo-400" />
                        {job.pesoGramos}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center / Right: Progress (if running) & Financial stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {isRunning && (
                    <div className="w-full sm:w-48 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Progreso</span>
                        <span className="font-bold text-amber-400">
                          {job.progresoPorcentaje}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-1.5 rounded-full"
                          style={{ width: `${job.progresoPorcentaje}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-zinc-400">Precio Venta</span>
                    <span className="text-sm font-bold text-white font-mono">
                      ${job.precioVenta.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +${job.gananciaNeta.toFixed(2)}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTrabajo(job);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                      title="Ver detalle de costos y orden"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isPending && (
                      <button
                        onClick={() => handleIniciar(job)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar</span>
                      </button>
                    )}

                    {isRunning && (
                      <button
                        onClick={() => handleCompletar(job)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completar</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCancelar(job)}
                      disabled={isProcessing}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      title="Cancelar trabajo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detalle Modal */}
      <DetalleTrabajoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        trabajo={selectedTrabajo}
      />
    </div>
  );
};
