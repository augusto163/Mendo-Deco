"use client";

import React, { useState, useMemo } from "react";
import {
  Disc,
  Plus,
  Search,
  Scale,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  BadgeDollarSign,
  Layers,
} from "lucide-react";
import { Bobina } from "../types";
import { BobinaModal } from "./BobinaModal";

interface FilamentosPanelProps {
  spools: Bobina[];
  onSaveSpool: (spoolData: Partial<Bobina>) => Promise<void>;
  onDeleteSpool: (id: number) => Promise<void>;
  showToast: (msg: string) => void;
}

export const FilamentosPanel: React.FC<FilamentosPanelProps> = ({
  spools,
  onSaveSpool,
  onDeleteSpool,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSpool, setSelectedSpool] = useState<Bobina | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("todos");

  // Quick weight adjustment state
  const [quickWeighId, setQuickWeighId] = useState<number | null>(null);
  const [quickGrams, setQuickGrams] = useState<number>(500);

  // Totales
  const stats = useMemo(() => {
    const totalGrams = spools.reduce((acc, s) => acc + s.peso_actual_g, 0);
    const totalCapital = spools.reduce(
      (acc, s) => acc + s.peso_actual_g * (s.costo_compra / (s.peso_total_g || 1000)),
      0
    );
    const criticalCount = spools.filter(
      (s) => (s.peso_actual_g / (s.peso_total_g || 1000)) * 100 < 20
    ).length;
    return {
      totalKg: (totalGrams / 1000).toFixed(2),
      totalCapital: totalCapital.toFixed(2),
      criticalCount,
    };
  }, [spools]);

  // Unique materials for filter pills
  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    spools.forEach((s) => set.add(s.material));
    return ["todos", ...Array.from(set)];
  }, [spools]);

  // Filtered Spools
  const filteredSpools = useMemo(() => {
    return spools.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchQuery =
        q === "" ||
        s.marca.toLowerCase().includes(q) ||
        s.material.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q);
      const matchMat =
        selectedMaterial === "todos" ||
        s.material.toLowerCase() === selectedMaterial.toLowerCase();
      return matchQuery && matchMat;
    });
  }, [spools, searchTerm, selectedMaterial]);

  const handleOpenCreate = () => {
    setSelectedSpool(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (spool: Bobina) => {
    setSelectedSpool(spool);
    setModalOpen(true);
  };

  const handleQuickWeighSubmit = async (spoolId: number) => {
    try {
      await onSaveSpool({ id: spoolId, peso_actual_g: quickGrams });
      showToast(`Stock actualizado a ${quickGrams}g.`);
      setQuickWeighId(null);
    } catch (err: any) {
      alert("Error al actualizar peso: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Stock Total en Granja</span>
            <span className="text-2xl font-black text-white">{stats.totalKg} kg</span>
            <span className="text-[11px] text-zinc-500 block mt-1">
              {spools.length} bobinas en inventario
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Disc className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Capital en Filamentos</span>
            <span className="text-2xl font-black text-emerald-400">${stats.totalCapital}</span>
            <span className="text-[11px] text-zinc-500 block mt-1">Valoración actual de stock</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Bobinas Críticas (&lt;20%)</span>
            <span
              className={`text-2xl font-black ${
                stats.criticalCount > 0 ? "text-amber-400" : "text-zinc-200"
              }`}
            >
              {stats.criticalCount}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">Próximas a agotarse</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls: Search, Filters & Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-1 items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, color, material..."
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {availableMaterials.map((mat) => (
            <button
              key={mat}
              onClick={() => setSelectedMaterial(mat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors uppercase ${
                selectedMaterial === mat
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white"
              }`}
            >
              {mat}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Bobina</span>
        </button>
      </div>

      {/* Spools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSpools.map((spool) => {
          const percent = Math.min(
            100,
            Math.max(0, Math.round((spool.peso_actual_g / (spool.peso_total_g || 1000)) * 100))
          );
          const isLow = percent < 20;
          const isExhausted = spool.peso_actual_g <= 0;
          const costPerGram = spool.costo_compra / (spool.peso_total_g || 1000);

          return (
            <div
              key={spool.id}
              className={`bg-zinc-900/90 rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-sm ${
                isExhausted
                  ? "border-zinc-800 opacity-60 bg-zinc-950/40"
                  : isLow
                  ? "border-amber-500/40"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                {/* Header: Color Swatch + Brand / Material */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border border-white/20 shadow-md flex-shrink-0 relative overflow-hidden"
                      style={{ backgroundColor: spool.hex }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {spool.marca} {spool.material}
                      </h4>
                      <span className="text-xs text-zinc-400 block">{spool.color}</span>
                    </div>
                  </div>

                  {spool.ubicacion_slot_ams && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {spool.ubicacion_slot_ams}
                    </span>
                  )}
                </div>

                {/* Gauge bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Stock restante</span>
                    <span
                      className={`font-bold ${
                        isExhausted ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {spool.peso_actual_g}g / {spool.peso_total_g}g ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isExhausted
                          ? "bg-rose-500"
                          : isLow
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-emerald-500 to-teal-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Price and Cost per Gram */}
                <div className="grid grid-cols-2 gap-2 text-xs my-3 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Costo Bobina</span>
                    <span className="font-semibold text-zinc-200">${spool.costo_compra.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Por gramo</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      ${costPerGram.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick weight adjustment form or Action Buttons */}
              <div className="pt-3 border-t border-zinc-800/80">
                {quickWeighId === spool.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={quickGrams}
                      onChange={(e) => setQuickGrams(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleQuickWeighSubmit(spool.id)}
                      className="px-2.5 py-1 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setQuickWeighId(null)}
                      className="px-2 py-1 text-zinc-400 text-xs hover:text-white"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        setQuickWeighId(spool.id);
                        setQuickGrams(spool.peso_actual_g);
                      }}
                      title="Pesar o calibrar stock actual"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pesar</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(spool)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Editar bobina"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSpool(spool.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar bobina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spool Modal */}
      <BobinaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        spool={selectedSpool}
        onSave={onSaveSpool}
        onDelete={onDeleteSpool}
      />
    </div>
  );
};
