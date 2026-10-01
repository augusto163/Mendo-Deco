"use client";

import React, { useState, useMemo } from "react";
import {
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  BadgeDollarSign,
  Search,
  CheckCircle2,
  Calendar,
  X,
  User,
  ArrowRight,
  Disc,
} from "lucide-react";
import { Trabajo } from "../types";

interface StockProductosPanelProps {
  trabajos: Trabajo[];
  onRegistrarVenta: (
    jobId: number,
    unidades: number,
    precioUnitario?: number,
    cliente?: string
  ) => Promise<void>;
  showToast: (msg: string) => void;
}

export const StockProductosPanel: React.FC<StockProductosPanelProps> = ({
  trabajos,
  onRegistrarVenta,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrabajoVenta, setSelectedTrabajoVenta] = useState<Trabajo | null>(null);
  const [unidadesAVender, setUnidadesAVender] = useState<number>(1);
  const [precioVentaPersonalizado, setPrecioVentaPersonalizado] = useState<number>(0);
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [isSelling, setIsSelling] = useState(false);

  // Filtrar solo trabajos completados
  const completados = useMemo(() => {
    return trabajos.filter((t) => t.estado === "completado");
  }, [trabajos]);

  // Resumen métrico
  const metrics = useMemo(() => {
    let piezasEnStock = 0;
    let capitalEnStock = 0;
    let valorVentaEnStock = 0;
    let piezasVendidasTotal = 0;
    let ingresosRealizadosTotal = 0;

    completados.forEach((t) => {
      const cant = t.cantidad || 1;
      const costoUnitario = t.costoTotal / cant;
      const precioUnitario = t.precioVenta / cant;

      const stockActual = t.unidadesEnStock !== undefined ? t.unidadesEnStock : (t.estadoVenta !== "vendido" ? cant : 0);
      const vendidasActual = t.unidadesVendidas !== undefined ? t.unidadesVendidas : (t.estadoVenta === "vendido" ? cant : 0);

      piezasEnStock += stockActual;
      capitalEnStock += stockActual * costoUnitario;
      valorVentaEnStock += stockActual * precioUnitario;

      piezasVendidasTotal += vendidasActual;
      ingresosRealizadosTotal += vendidasActual * precioUnitario;
    });

    return {
      piezasEnStock,
      capitalEnStock: Math.round(capitalEnStock * 100) / 100,
      valorVentaEnStock: Math.round(valorVentaEnStock * 100) / 100,
      piezasVendidasTotal,
      ingresosRealizadosTotal: Math.round(ingresosRealizadosTotal * 100) / 100,
    };
  }, [completados]);

  // Filtro de búsqueda
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return completados;
    return completados.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) ||
        t.codigo.toLowerCase().includes(q) ||
        (t.cliente && t.cliente.toLowerCase().includes(q))
    );
  }, [completados, searchTerm]);

  const handleOpenVentaModal = (t: Trabajo) => {
    setSelectedTrabajoVenta(t);
    const stockDisp = t.unidadesEnStock > 0 ? t.unidadesEnStock : t.cantidad;
    setUnidadesAVender(Math.min(1, stockDisp));
    const cant = t.cantidad || 1;
    setPrecioVentaPersonalizado(Math.round((t.precioVenta / cant) * 100) / 100);
    setClienteNombre(t.cliente || "");
  };

  const handleConfirmVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajoVenta) return;

    setIsSelling(true);
    try {
      await onRegistrarVenta(
        selectedTrabajoVenta.id,
        unidadesAVender,
        precioVentaPersonalizado,
        clienteNombre
      );
      showToast("✓ ¡Venta registrada: " + unidadesAVender + " unidad(es) de " + selectedTrabajoVenta.nombre + "!");
      setSelectedTrabajoVenta(null);
    } catch (err: any) {
      alert("Error al registrar venta: " + err.message);
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Piezas en Stock Físico</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {metrics.piezasEnStock} u.
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">Disponibles en taller</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Capital en Stock Terminado</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              ${metrics.capitalEnStock.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">Costo de material y luz</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Valor Comercial en Stock</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              ${metrics.valorVentaEnStock.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">A precio sugerido</span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Piezas Vendidas / Entregadas</span>
            <span className="text-2xl font-black text-white font-mono">
              {metrics.piezasVendidasTotal} u.
            </span>
            <span className="text-[11px] text-emerald-400/90 block mt-1 font-semibold">
              ${metrics.ingresosRealizadosTotal.toFixed(2)} cobrados
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-1 items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto por nombre, orden o cliente..."
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500"
          />
        </div>
        <span className="text-xs text-zinc-400 flex items-center gap-1.5 self-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {completados.length} lote(s) impresos en historial
        </span>
      </div>

      {/* Grid of Finished Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs">
            No hay productos terminados registrados aún. Completa una impresión para que ingrese automáticamente al stock.
          </div>
        ) : (
          filtered.map((t) => {
            const cant = t.cantidad || 1;
            const stockDisp = t.unidadesEnStock !== undefined ? t.unidadesEnStock : (t.estadoVenta !== "vendido" ? cant : 0);
            const vendidas = t.unidadesVendidas !== undefined ? t.unidadesVendidas : (t.estadoVenta === "vendido" ? cant : 0);
            const costoUnitario = t.costoTotal / cant;
            const precioUnitario = t.precioVenta / cant;
            const isAllSold = stockDisp === 0 && vendidas > 0;

            return (
              <div
                key={t.id}
                className={"bg-zinc-900/90 rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-sm " + (isAllSold ? "border-zinc-800/60 opacity-60 bg-zinc-950/40" : "border-zinc-800 hover:border-zinc-700")}
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-zinc-400">{t.codigo}</span>
                    <span
                      className={"text-[10px] font-bold px-2 py-0.5 rounded-full border " + (stockDisp > 0 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700")}
                    >
                      {stockDisp > 0 ? "Stock: " + stockDisp + " u." : "Vendido Completo"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-1 mb-1">
                    {t.nombre}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                    <span className="text-[11px] text-zinc-500">{t.fecha}</span>
                    <span>•</span>
                    <span className="text-zinc-300">{t.material}</span>
                    <span>•</span>
                    <span className="text-zinc-400">{t.cliente}</span>
                  </div>

                  {/* Stock counter pills */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">En Taller</span>
                      <span className={"font-bold font-mono " + (stockDisp > 0 ? "text-emerald-400 text-sm" : "text-zinc-500")}>
                        {stockDisp} u.
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Entregadas</span>
                      <span className="font-bold text-zinc-300 font-mono text-sm">
                        {vendidas} u.
                      </span>
                    </div>
                  </div>

                  {/* Pricing info */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Costo unitario</span>
                      <span className="text-zinc-300 font-semibold font-mono">
                        ${costoUnitario.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Precio sugerido</span>
                      <span className="text-cyan-400 font-semibold font-mono">
                        ${precioUnitario.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sell Action */}
                <div className="pt-3 border-t border-zinc-800/80">
                  {stockDisp > 0 ? (
                    <button
                      onClick={() => handleOpenVentaModal(t)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Registrar Venta / Salida</span>
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-zinc-500 py-1 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Todas las unidades vendidas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Registrar Venta */}
      {selectedTrabajoVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Registrar Venta / Salida</h3>
                  <span className="text-xs text-zinc-400">{selectedTrabajoVenta.nombre}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrabajoVenta(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmVenta} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Cantidad de piezas a vender:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={selectedTrabajoVenta.unidadesEnStock > 0 ? selectedTrabajoVenta.unidadesEnStock : selectedTrabajoVenta.cantidad}
                    value={unidadesAVender}
                    onChange={(e) => setUnidadesAVender(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400">
                    Disponibles en taller:{" "}
                    <strong className="text-emerald-400 font-mono">
                      {selectedTrabajoVenta.unidadesEnStock > 0 ? selectedTrabajoVenta.unidadesEnStock : selectedTrabajoVenta.cantidad} u.
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Precio de venta por unidad ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVentaPersonalizado}
                  onChange={(e) => setPrecioVentaPersonalizado(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Cliente / Comprador:
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente o destino..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Total a facturar:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ${(unidadesAVender * precioVentaPersonalizado).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Quedarán en stock:</span>
                  <span className="font-mono">
                    {Math.max(0, (selectedTrabajoVenta.unidadesEnStock > 0 ? selectedTrabajoVenta.unidadesEnStock : selectedTrabajoVenta.cantidad) - unidadesAVender)} u.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedTrabajoVenta(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSelling}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSelling ? "Registrando..." : "Confirmar Venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
