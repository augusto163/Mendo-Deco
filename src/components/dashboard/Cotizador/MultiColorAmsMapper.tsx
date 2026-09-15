"use client";

import React from "react";
import { Disc, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Bobina, TrabajoMaterialAms } from "../types";
import { BambuFilament } from "@/utils/bambuParser";

interface MultiColorAmsMapperProps {
  detectedFilaments: BambuFilament[];
  spools: Bobina[];
  materialesAms: TrabajoMaterialAms[];
  onChangeMaterial: (index: number, bobinaId: number) => void;
}

export const MultiColorAmsMapper: React.FC<MultiColorAmsMapperProps> = ({
  detectedFilaments,
  spools,
  materialesAms,
  onChangeMaterial,
}) => {
  if (!detectedFilaments || detectedFilaments.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mapeo de Filamentos AMS Multi-Color</h3>
            <p className="text-xs text-zinc-400">
              Se detectaron {detectedFilaments.length} filamento(s) en el archivo .3mf. Asocia cada uno con una bobina de tu inventario:
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {materialesAms.map((mat, idx) => {
          const selectedSpool = spools.find((s) => s.id === mat.bobinaId);
          const hasEnoughStock = selectedSpool ? selectedSpool.peso_actual_g >= mat.gramos_usados : false;

          return (
            <div
              key={idx}
              className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: mat.color_hex || "#888888" }}
                    title={mat.color_hex}
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">
                      Slot AMS #{mat.slot_ams}: {mat.color_nombre}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Consumo estimado: <strong className="text-emerald-400">{mat.gramos_usados}g</strong>
                    </span>
                  </div>
                </div>

                {selectedSpool && (
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block">Costo calculado</span>
                    <span className="text-xs font-semibold text-zinc-200">
                      ${mat.costo_calculado.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Selector de Bobina */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Bobina asignada del stock
                </label>
                <select
                  value={mat.bobinaId || ""}
                  onChange={(e) => onChangeMaterial(idx, Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>
                    -- Seleccionar bobina --
                  </option>
                  {spools.map((spool) => (
                    <option key={spool.id} value={spool.id}>
                      {spool.marca} {spool.material} - {spool.color} (Stock: {spool.peso_actual_g}g / $
                      {(spool.costo_compra / spool.peso_total_g).toFixed(3)}/g)
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado de stock de la bobina */}
              {selectedSpool && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedSpool.hex }}
                    />
                    <span className="text-zinc-400">
                      Quedan <strong>{selectedSpool.peso_actual_g}g</strong>
                    </span>
                  </div>

                  {hasEnoughStock ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stock suficiente
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Faltan{" "}
                      {(mat.gramos_usados - selectedSpool.peso_actual_g).toFixed(0)}g
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
