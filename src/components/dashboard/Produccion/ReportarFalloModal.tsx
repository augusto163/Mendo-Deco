"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  Layers,
  Percent,
  Scale,
  X,
  Disc,
} from "lucide-react";
import { Trabajo } from "../types";

interface ReportarFalloModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: Trabajo | null;
  onConfirmFallo: (data: {
    jobId: number;
    desperdicioGramos: number;
    tiempoTranscurridoMin: number;
    progresoPorcentaje: number;
    motivoFallo: string;
  }) => Promise<void>;
}

export const ReportarFalloModal: React.FC<ReportarFalloModalProps> = ({
  isOpen,
  onClose,
  trabajo,
  onConfirmFallo,
}) => {
  const [modoCalculo, setModoCalculo] = useState<"tiempo" | "capa" | "porcentaje" | "balanza">("tiempo");
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(30);
  const [capaActual, setCapaActual] = useState<number>(50);
  const [capasTotales, setCapasTotales] = useState<number>(200);
  const [porcentajePantalla, setPorcentajePantalla] = useState<number>(25);
  const [pesoBalanza, setPesoBalanza] = useState<number>(15);
  const [motivoFallo, setMotivoFallo] = useState<string>("Despegue de la cama (Warping)");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (trabajo) {
      const halfTime = Math.max(5, Math.round(trabajo.tiempoMinutos * 0.4));
      setTiempoTranscurrido(halfTime);
      setPorcentajePantalla(40);
      setPesoBalanza(Math.max(1, Math.round(trabajo.pesoGramos * 0.4)));
    }
  }, [trabajo]);

  const calculation = useMemo(() => {
    if (!trabajo) {
      return {
        desperdicioGramos: 0,
        progresoPct: 0,
        tiempoEfectivoMin: 0,
        costoPerdido: 0,
        filamentoSalvado: 0,
      };
    }

    let progresoRatio = 0.5;
    let desperdicioGramos = 0;
    let tiempoEfectivoMin = 0;

    if (modoCalculo === "tiempo") {
      tiempoEfectivoMin = Math.min(trabajo.tiempoMinutos, Math.max(1, tiempoTranscurrido));
      progresoRatio = trabajo.tiempoMinutos > 0 ? tiempoEfectivoMin / trabajo.tiempoMinutos : 0.5;
      desperdicioGramos = Math.round(trabajo.pesoGramos * progresoRatio * 10) / 10;
    } else if (modoCalculo === "capa") {
      const tot = Math.max(1, capasTotales);
      const act = Math.min(tot, Math.max(1, capaActual));
      progresoRatio = act / tot;
      tiempoEfectivoMin = Math.round(trabajo.tiempoMinutos * progresoRatio);
      desperdicioGramos = Math.round(trabajo.pesoGramos * progresoRatio * 10) / 10;
    } else if (modoCalculo === "porcentaje") {
      progresoRatio = Math.min(100, Math.max(1, porcentajePantalla)) / 100;
      tiempoEfectivoMin = Math.round(trabajo.tiempoMinutos * progresoRatio);
      desperdicioGramos = Math.round(trabajo.pesoGramos * progresoRatio * 10) / 10;
    } else if (modoCalculo === "balanza") {
      desperdicioGramos = Math.min(trabajo.pesoGramos, Math.max(0.5, pesoBalanza));
      progresoRatio = trabajo.pesoGramos > 0 ? desperdicioGramos / trabajo.pesoGramos : 0.5;
      tiempoEfectivoMin = Math.round(trabajo.tiempoMinutos * progresoRatio);
    }

    const progresoPct = Math.min(100, Math.max(1, Math.round(progresoRatio * 100)));
    const costoFilamento = (trabajo.costoFilamento || 0) * progresoRatio;
    const costoLuz = (trabajo.costoElectricidad || 0) * progresoRatio;
    const costoMaq = (trabajo.costoAmortizacion || 0) * progresoRatio;
    const costoPerdido = Math.round((costoFilamento + costoLuz + costoMaq) * 100) / 100;

    return {
      desperdicioGramos,
      progresoPct,
      tiempoEfectivoMin,
      costoPerdido,
      filamentoSalvado: Math.max(0, Math.round((trabajo.pesoGramos - desperdicioGramos) * 10) / 10),
    };
  }, [modoCalculo, tiempoTranscurrido, capaActual, capasTotales, porcentajePantalla, pesoBalanza, trabajo]);

  if (!isOpen || !trabajo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmFallo({
        jobId: trabajo.id,
        desperdicioGramos: calculation.desperdicioGramos,
        tiempoTranscurridoMin: calculation.tiempoEfectivoMin,
        progresoPorcentaje: calculation.progresoPct,
        motivoFallo,
      });
      onClose();
    } catch (err: any) {
      alert("Error reportando falla: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const motivosSugeridos = [
    "Despegue de la cama (Warping)",
    "Boquilla / Extrusor tapado (Clog)",
    "Enredo de filamento en la bobina",
    "Pérdida de pasos / Desfase de capa",
    "Corte imprevisto de energía eléctrica",
    "Falla de soportes o voladizo",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reportar Falla de Impresión</h3>
              <p className="text-xs text-zinc-400">
                Orden <span className="font-mono text-zinc-300 font-semibold">{trabajo.codigo}</span> • {trabajo.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              ¿Cómo deseas registrar el avance al momento de la falla?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setModoCalculo("tiempo")}
                className={"flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all " + (modoCalculo === "tiempo" ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
              >
                <Clock className="w-4 h-4 mb-1 text-cyan-400" />
                <span>Tiempo</span>
              </button>

              <button
                type="button"
                onClick={() => setModoCalculo("porcentaje")}
                className={"flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all " + (modoCalculo === "porcentaje" ? "bg-amber-500/20 border-amber-500 text-amber-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
              >
                <Percent className="w-4 h-4 mb-1 text-amber-400" />
                <span>% Pantalla</span>
              </button>

              <button
                type="button"
                onClick={() => setModoCalculo("capa")}
                className={"flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all " + (modoCalculo === "capa" ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
              >
                <Layers className="w-4 h-4 mb-1 text-emerald-400" />
                <span>Capa</span>
              </button>

              <button
                type="button"
                onClick={() => setModoCalculo("balanza")}
                className={"flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all " + (modoCalculo === "balanza" ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")}
              >
                <Scale className="w-4 h-4 mb-1 text-indigo-400" />
                <span>Balanza</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            {modoCalculo === "tiempo" && (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                  <span>¿A cuántos minutos de impresión falló?</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {tiempoTranscurrido} min / {trabajo.tiempoMinutos} min totales
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={trabajo.tiempoMinutos}
                  value={tiempoTranscurrido}
                  onChange={(e) => setTiempoTranscurrido(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Inicio (1m)</span>
                  <span>Mitad ({Math.round(trabajo.tiempoMinutos / 2)}m)</span>
                  <span>Final ({trabajo.tiempoMinutos}m)</span>
                </div>
              </div>
            )}

            {modoCalculo === "porcentaje" && (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                  <span>Porcentaje que indicaba la pantalla de la Bambu Lab:</span>
                  <span className="text-amber-400 font-mono font-bold">{porcentajePantalla}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={porcentajePantalla}
                  onChange={(e) => setPorcentajePantalla(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>
            )}

            {modoCalculo === "capa" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Capa donde falló:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={capasTotales}
                    value={capaActual}
                    onChange={(e) => setCapaActual(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Capas totales del slice:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capasTotales}
                    onChange={(e) => setCapasTotales(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>
            )}

            {modoCalculo === "balanza" && (
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Peso real de la pieza fallida en balanza (gramos):
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={trabajo.pesoGramos}
                    value={pesoBalanza}
                    onChange={(e) => setPesoBalanza(Math.max(0.1, Number(e.target.value)))}
                    placeholder="Ej. 24.5"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Pieza completa proyectada: {trabajo.pesoGramos}g
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <Disc className="w-4 h-4" /> Cálculo de Merma & Descuento Real
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Filamento Desperdiciado</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {calculation.desperdicioGramos}g
                </span>
                <span className="text-[10px] text-zinc-500 block">se descuenta de stock</span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Filamento No Consumido</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {calculation.filamentoSalvado}g
                </span>
                <span className="text-[10px] text-zinc-500 block">permanece en bobina</span>
              </div>

              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-zinc-400 block">Costo de la Merma</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  ${calculation.costoPerdido.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 block">pérdida registrada</span>
              </div>
            </div>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              ⚠️ La impresora quedará inmediatamente <strong>DISPONIBLE</strong> sumando {Math.round(calculation.tiempoEfectivoMin)} minutos a su historial de uso real.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Motivo o causa de la falla:
            </label>
            <input
              type="text"
              value={motivoFallo}
              onChange={(e) => setMotivoFallo(e.target.value)}
              placeholder="Describe qué sucedió..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {motivosSugeridos.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivoFallo(m)}
                  className="px-2 py-0.5 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? "Registrando..." : "Confirmar Falla y Descontar Merma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
