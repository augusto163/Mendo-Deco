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
  TrendingUp,
  Eye,
  AlertTriangle,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { Trabajo, Impresora } from "../types";
import { DetalleTrabajoModal } from "./DetalleTrabajoModal";
import { ReportarFalloModal } from "./ReportarFalloModal";
import { StockProductosPanel } from "./StockProductosPanel";

interface ColaProduccionPanelProps {
  trabajos: Trabajo[];
  printers: Impresora[];
  onIniciarTrabajo: (jobId: number, printerId?: number) => Promise<void>;
  onCompletarTrabajo: (jobId: number) => Promise<void>;
  onCancelarTrabajo: (jobId: number) => Promise<void>;
  onReportarFallo?: (data: {
    jobId: number;
    desperdicioGramos: number;
    tiempoTranscurridoMin: number;
    progresoPorcentaje: number;
    motivoFallo: string;
  }) => Promise<void>;
  onRegistrarVenta?: (
    jobId: number,
    unidades: number,
    precioUnitario?: number,
    cliente?: string
  ) => Promise<void>;
  showToast: (msg: string) => void;
}

export const ColaProduccionPanel: React.FC<ColaProduccionPanelProps> = ({
  trabajos,
  printers,
  onIniciarTrabajo,
  onCompletarTrabajo,
  onCancelarTrabajo,
  onReportarFallo,
  onRegistrarVenta,
  showToast,
}) => {
  const [mainView, setMainView] = useState<"cola" | "stock">("cola");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isProcessingId, setIsProcessingId] = useState<number | null>(null);

  // Fallo Modal State
  const [falloModalOpen, setFalloModalOpen] = useState<boolean>(false);
  const [failingJob, setFailingJob] = useState<Trabajo | null>(null);

  const piezasEnStockCount = trabajos
    .filter((t) => t.estado === "completado")
    .reduce((sum, t) => sum + (t.unidadesEnStock !== undefined ? t.unidadesEnStock : (t.estadoVenta !== "vendido" ? (t.cantidad || 1) : 0)), 0);

  const filteredJobs =
    statusFilter === "todos"
      ? trabajos
      : statusFilter === "ejecucion"
      ? trabajos.filter((t) => t.estado === "ejecucion")
      : statusFilter === "espera"
      ? trabajos.filter((t) => t.estado === "espera")
      : statusFilter === "completado"
      ? trabajos.filter((t) => t.estado === "completado")
      : statusFilter === "fallido"
      ? trabajos.filter((t) => t.estado === "fallido")
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
    const cant = job.cantidad || 1;
    if (
      confirm(
        "¿Marcar \"" + job.nombre + "\" (" + cant + " u.) como completado?\nSe descontará automáticamente el filamento usado y las piezas ingresarán al stock del taller."
      )
    ) {
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

  const handleAbrirFalloModal = (job: Trabajo) => {
    setFailingJob(job);
    setFalloModalOpen(true);
  };

  const handleConfirmFallo = async (data: {
    jobId: number;
    desperdicioGramos: number;
    tiempoTranscurridoMin: number;
    progresoPorcentaje: number;
    motivoFallo: string;
  }) => {
    if (onReportarFallo) {
      await onReportarFallo(data);
    } else {
      const res = await fetch("/api/trabajos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.jobId,
          accion: "FALLIDO",
          desperdicio_gramos: data.desperdicioGramos,
          minutos_transcurridos: data.tiempoTranscurridoMin,
          progreso_porcentaje: data.progresoPorcentaje,
          motivo_fallo: data.motivoFallo,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al reportar fallo");
    }
    showToast("⚠️ Falla registrada: Se descontaron " + data.desperdicioGramos + "g de merma y se liberó la impresora.");
  };

  const handleCancelar = async (job: Trabajo) => {
    if (confirm("¿Cancelar y eliminar la orden \"" + job.nombre + "\"?")) {
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
      {/* Selector Principal de Vista: Cola de Fabricación vs Stock & Ventas */}
      <div className="flex items-center justify-between bg-zinc-900/90 p-2 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMainView("cola")}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all " + (mainView === "cola" ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20" : "text-zinc-400 hover:text-white")}
          >
            <Layers className="w-4 h-4" />
            <span>Cola de Fabricación ({trabajos.length})</span>
          </button>

          <button
            onClick={() => setMainView("stock")}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative " + (mainView === "stock" ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20" : "text-zinc-400 hover:text-white")}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Stock Terminado & Ventas</span>
            {piezasEnStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {piezasEnStockCount} u.
              </span>
            )}
          </button>
        </div>
      </div>

      {mainView === "stock" ? (
        <StockProductosPanel
          trabajos={trabajos}
          onRegistrarVenta={
            onRegistrarVenta ||
            (async (jobId, unidades, precioUnitario, cliente) => {
              const res = await fetch("/api/trabajos", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: jobId,
                  accion: "REGISTRAR_VENTA",
                  unidades,
                  precio_unitario: precioUnitario,
                  cliente,
                }),
              });
              const json = await res.json();
              if (!json.success) throw new Error(json.error || "Error al registrar venta");
            })
          }
          showToast={showToast}
        />
      ) : (
        <>
          {/* Header de Filtros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "todos", label: "Todos (" + trabajos.length + ")" },
              {
                id: "ejecucion",
                label: "En Ejecución (" + trabajos.filter((t) => t.estado === "ejecucion").length + ")",
              },
              {
                id: "espera",
                label: "En Espera (" + trabajos.filter((t) => t.estado === "espera").length + ")",
              },
              {
                id: "completado",
                label: "Completados (" + trabajos.filter((t) => t.estado === "completado").length + ")",
              },
              {
                id: "fallido",
                label: "Fallidas / Merma (" + trabajos.filter((t) => t.estado === "fallido").length + ")",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={"px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all " + (statusFilter === tab.id ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lista de Trabajos */}
          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs">
                No hay trabajos en este estado actualmente.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isProcessing = isProcessingId === job.id;
                const isFailed = job.estado === "fallido";
                const isRunning = job.estado === "ejecucion";
                const isCompleted = job.estado === "completado";
                const cant = job.cantidad || 1;

                return (
                  <div
                    key={job.id}
                    className={"rounded-2xl p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm " + (isFailed ? "bg-rose-950/20 border-rose-900/50" : isRunning ? "bg-cyan-950/20 border-cyan-500/30" : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700")}
                  >
                    {/* Left: Info Principal */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={"w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0 " + (isFailed ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : isRunning ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400")}>
                        {isFailed ? (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        ) : isRunning ? (
                          <Play className="w-5 h-5 text-cyan-400" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-zinc-400">
                            {job.codigo}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full border " + (isFailed ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : isRunning ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse" : isCompleted ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
                            {isFailed ? "FALLIDO (Merma)" : isRunning ? "IMPRIMIENDO (" + job.progresoPorcentaje + "%)" : isCompleted ? "COMPLETADO" : "EN ESPERA"}
                          </span>

                          {/* Cantidad multiplicador badge */}
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            x{cant} u.
                          </span>

                          {/* Destino badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {job.tipoDestino === "stock" ? "Para Stock Taller" : "Pedido Cliente"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-tight">
                          {job.nombre}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-0.5">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Printer className="w-3.5 h-3.5 text-zinc-500" />
                            {job.impresoraNombre || "Auto"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Disc className="w-3.5 h-3.5 text-zinc-500" />
                            {job.material} ({job.color})
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            {job.cliente}
                          </span>
                        </div>

                        {/* Motivo de fallo si es fallida */}
                        {isFailed && (
                          <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-0.5">
                            <span className="font-bold">Motivo: </span>
                            <span>{job.motivoFallo || "Falla no especificada"}</span>
                            <span className="block text-[11px] text-rose-400 font-mono">
                              Desperdicio real: {job.desperdicioGramos || 0}g descontados de la bobina
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Métricas técnicas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Tiempo Total</span>
                        <span className="font-semibold text-zinc-300 font-mono">
                          {job.tiempoMinutos} min
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Peso Total</span>
                        <span className="font-semibold text-zinc-300 font-mono">
                          {job.pesoGramos}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Costo Fab.</span>
                        <span className="font-semibold text-zinc-300 font-mono">
                          ${job.costoTotal.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">{isFailed ? "Pérdida" : "Precio Venta"}</span>
                        <span className={"font-bold font-mono " + (isFailed ? "text-rose-400" : "text-emerald-400")}>
                          {isFailed ? "-$" + job.costoTotal.toFixed(2) : "$" + job.precioVenta.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Acciones */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          setSelectedTrabajo(job);
                          setModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {job.estado === "espera" && (
                        <button
                          onClick={() => handleIniciar(job)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Iniciar</span>
                        </button>
                      )}

                      {isRunning && (
                        <>
                          <button
                            onClick={() => handleCompletar(job)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completar</span>
                          </button>

                          <button
                            onClick={() => handleAbrirFalloModal(job)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all disabled:opacity-50"
                            title="Reportar problema o impresión fallida"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Reportar Falla</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleCancelar(job)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Eliminar trabajo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Detalle Modal */}
      <DetalleTrabajoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        trabajo={selectedTrabajo}
      />

      {/* Reportar Fallo Modal */}
      <ReportarFalloModal
        isOpen={falloModalOpen}
        onClose={() => {
          setFalloModalOpen(false);
          setFailingJob(null);
        }}
        trabajo={failingJob}
        onConfirmFallo={handleConfirmFallo}
      />
    </div>
  );
};
