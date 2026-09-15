"use client";

import React, { useState, useEffect } from "react";
import { X, Disc, Check, Trash2 } from "lucide-react";
import { Bobina } from "../types";

interface BobinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  spool: Bobina | null;
  onSave: (spoolData: Partial<Bobina>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const BobinaModal: React.FC<BobinaModalProps> = ({
  isOpen,
  onClose,
  spool,
  onSave,
  onDelete,
}) => {
  const [marca, setMarca] = useState("eSun");
  const [material, setMaterial] = useState("PLA+");
  const [color, setColor] = useState("Negro Mate");
  const [hex, setHex] = useState("#18181b");
  const [pesoTotal, setPesoTotal] = useState(1000);
  const [pesoActual, setPesoActual] = useState(1000);
  const [costoCompra, setCostoCompra] = useState(24.0);
  const [ubicacionAms, setUbicacionAms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (spool) {
      setMarca(spool.marca);
      setMaterial(spool.material);
      setColor(spool.color);
      setHex(spool.hex);
      setPesoTotal(spool.peso_total_g);
      setPesoActual(spool.peso_actual_g);
      setCostoCompra(spool.costo_compra);
      setUbicacionAms(spool.ubicacion_slot_ams || "");
    } else {
      setMarca("eSun");
      setMaterial("PLA+");
      setColor("Negro Mate");
      setHex("#1e293b");
      setPesoTotal(1000);
      setPesoActual(1000);
      setCostoCompra(24.0);
      setUbicacionAms("AMS 1 - Slot 1");
    }
  }, [spool, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...(spool && { id: spool.id }),
        marca,
        material,
        color,
        hex,
        peso_total_g: Number(pesoTotal),
        peso_actual_g: Number(pesoActual),
        costo_compra: Number(costoCompra),
        ubicacion_slot_ams: ubicacionAms || null,
      });
      onClose();
    } catch (err: any) {
      alert("Error al guardar bobina: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!spool || !onDelete) return;
    if (confirm(`¿Eliminar la bobina "${spool.marca} ${spool.material} - ${spool.color}"?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(spool.id);
        onClose();
      } catch (err: any) {
        alert("Error al eliminar bobina: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const costoGramo = pesoTotal > 0 ? costoCompra / pesoTotal : 0.024;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {spool ? "Editar Bobina" : "Nueva Bobina de Filamento"}
              </h3>
              <p className="text-xs text-zinc-400">Control de stock e inventario 3D</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Marca</label>
              <input
                type="text"
                required
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="eSun / Bambu Lab / Polymaker"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Material</label>
              <input
                type="text"
                required
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="PLA+ / PETG / TPU / ABS"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-8">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Nombre del Color
              </label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Negro Mate / Blanco Nieve / etc."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="col-span-4">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Color HEX</label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-1 px-2">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-zinc-400 uppercase">
                  {hex.slice(0, 7)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Peso Inicial (g)
              </label>
              <input
                type="number"
                value={pesoTotal}
                onChange={(e) => setPesoTotal(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Peso Actual (g)
              </label>
              <input
                type="number"
                value={pesoActual}
                onChange={(e) => setPesoActual(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Costo / Kg ($)
              </label>
              <input
                type="number"
                step="0.5"
                value={costoCompra}
                onChange={(e) => setCostoCompra(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Ubicación / Slot AMS (Opcional)
            </label>
            <input
              type="text"
              value={ubicacionAms}
              onChange={(e) => setUbicacionAms(e.target.value)}
              placeholder="Ej. AMS 1 - Slot 2"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 flex items-center justify-between">
            <span>Costo por gramo calculado:</span>
            <strong className="text-emerald-400 font-mono">${costoGramo.toFixed(4)} / g</strong>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            {spool && onDelete ? (
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
                <span>{spool ? "Guardar Cambios" : "Agregar Bobina"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
