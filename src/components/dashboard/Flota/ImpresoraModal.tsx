"use client";

import React, { useState, useEffect } from "react";
import { X, Printer, Check, Trash2 } from "lucide-react";
import { Impresora } from "../types";

interface ImpresoraModalProps {
  isOpen: boolean;
  onClose: () => void;
  impresora: Impresora | null;
  onSave: (impresoraData: Partial<Impresora>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const ImpresoraModal: React.FC<ImpresoraModalProps> = ({
  isOpen,
  onClose,
  impresora,
  onSave,
  onDelete,
}) => {
  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("Bambu Lab P1S");
  const [consumoKw, setConsumoKw] = useState(0.28);
  const [costoMaquina, setCostoMaquina] = useState(950);
  const [horasVidaUtil, setHorasVidaUtil] = useState(8000);
  const [estado, setEstado] = useState("DISPONIBLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (impresora) {
      setNombre(impresora.nombre);
      setModelo(impresora.modelo || "Bambu Lab P1S");
      setConsumoKw(impresora.consumo_kw);
      setCostoMaquina(impresora.costo_maquina);
      setHorasVidaUtil(impresora.horas_vida_util);
      setEstado(impresora.estado || "DISPONIBLE");
    } else {
      setNombre("Bambu Lab P1S #");
      setModelo("P1S + AMS Combo");
      setConsumoKw(0.28);
      setCostoMaquina(950);
      setHorasVidaUtil(8000);
      setEstado("DISPONIBLE");
    }
  }, [impresora, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...(impresora && { id: impresora.id }),
        nombre,
        modelo,
        consumo_kw: Number(consumoKw),
        costo_maquina: Number(costoMaquina),
        horas_vida_util: Number(horasVidaUtil),
        estado,
      });
      onClose();
    } catch (err: any) {
      alert("Error al guardar impresora: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!impresora || !onDelete) return;
    if (confirm(`¿Estás seguro de eliminar la impresora "${impresora.nombre}"?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(impresora.id);
        onClose();
      } catch (err: any) {
        alert("Error al eliminar impresora: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {impresora ? "Editar Impresora" : "Nueva Impresora"}
              </h3>
              <p className="text-xs text-zinc-400">Flota 3D conectada con Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Nombre / Identificador
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Bambu Lab P1S (AMS 1)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="P1S / X1C / A1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Estado Operativo
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="IMPRIMIENDO">IMPRIMIENDO</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                <option value="INACTIVA">INACTIVA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Consumo (kW)
              </label>
              <input
                type="number"
                step="0.01"
                value={consumoKw}
                onChange={(e) => setConsumoKw(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Costo ($USD)
              </label>
              <input
                type="number"
                value={costoMaquina}
                onChange={(e) => setCostoMaquina(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Vida Útil (h)
              </label>
              <input
                type="number"
                value={horasVidaUtil}
                onChange={(e) => setHorasVidaUtil(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
            <span>Costo de amortización calculado: </span>
            <strong className="text-emerald-400">
              ${horasVidaUtil > 0 ? (costoMaquina / horasVidaUtil).toFixed(4) : "0.0000"}/hora
            </strong>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            {impresora && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{impresora ? "Guardar Cambios" : "Crear Impresora"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
