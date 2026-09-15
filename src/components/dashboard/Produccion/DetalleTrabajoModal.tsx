"use client";

import React from "react";
import {
  X,
  FileCode,
  Printer,
  Disc,
  Clock,
  DollarSign,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Zap,
  Wrench,
} from "lucide-react";
import { Trabajo } from "../types";

interface DetalleTrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: Trabajo | null;
}

export const DetalleTrabajoModal: React.FC<DetalleTrabajoModalProps> = ({
  isOpen,
  onClose,
  trabajo,
}) => {
  if (!isOpen || !trabajo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {trabajo.codigo}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                  {trabajo.estado}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs">{trabajo.nombre}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Cliente e Impresora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-bold">
                Cliente
              </span>
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                {trabajo.cliente}
              </span>
              {trabajo.clienteTelefono && (
                <span className="text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  {trabajo.clienteTelefono}
                </span>
              )}
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-bold">
                Máquina Asignada
              </span>
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                {trabajo.impresoraNombre || "Sin asignar"}
              </span>
              <span className="text-zinc-500 mt-1 block">
                Tiempo: {trabajo.tiempoMinutos} min ({(trabajo.tiempoMinutos / 60).toFixed(1)} h)
              </span>
            </div>
          </div>

          {/* Materiales AMS */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block mb-2 uppercase font-bold flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-cyan-400" /> Materiales & Consumo AMS
            </span>
            {trabajo.materialesAms && trabajo.materialesAms.length > 0 ? (
              <div className="space-y-2">
                {trabajo.materialesAms.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: mat.color_hex }}
                      />
                      <span className="text-zinc-200 font-medium">
                        Slot #{mat.slot_ams}: {mat.color_nombre}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-400">
                      {mat.gramos_usados}g (${mat.costo_calculado.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">
                  {trabajo.material} - {trabajo.color}
                </span>
                <span className="font-mono font-bold text-emerald-400">{trabajo.pesoGramos}g</span>
              </div>
            )}
          </div>

          {/* Desglose de Costos */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-bold">
              Desglose Económico
            </span>
            <div className="flex justify-between py-1 border-b border-zinc-900 text-zinc-400">
              <span>Costo Filamento:</span>
              <span className="font-mono text-zinc-200">${trabajo.costoFilamento.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900 text-zinc-400">
              <span>Costo Electricidad:</span>
              <span className="font-mono text-zinc-200">${trabajo.costoElectricidad.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900 text-zinc-400">
              <span>Costo Amortización Máquina:</span>
              <span className="font-mono text-zinc-200">${trabajo.costoAmortizacion.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-900 text-zinc-400">
              <span>Mano de Obra:</span>
              <span className="font-mono text-zinc-200">${trabajo.costoManoObra.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-zinc-200 border-t border-zinc-800">
              <span>Costo Total Producción:</span>
              <span className="font-mono text-amber-400">${trabajo.costoTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Precio de Venta y Ganancia */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Precio de Venta Cobrado
              </span>
              <span className="text-xl font-black text-emerald-400">
                ${trabajo.precioVenta.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Ganancia Neta
              </span>
              <span className="text-lg font-black text-emerald-300">
                +${trabajo.gananciaNeta.toFixed(2)} ({trabajo.margenPorcentaje.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 text-xs font-semibold transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
