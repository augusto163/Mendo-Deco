"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FileCode,
  Layers,
  Upload,
  Clock,
  Scale,
  Printer,
  Sparkles,
  AlertTriangle,
  User,
  Phone,
} from "lucide-react";
import { Impresora, Bobina, ConfiguracionCostos, TrabajoMaterialAms } from "../types";
import { parseBambu3mf, BambuSliceMetadata, matchFilamentToSpool } from "@/utils/bambuParser";
import { MultiColorAmsMapper } from "./MultiColorAmsMapper";
import { ResumenCostosCard } from "./ResumenCostosCard";

interface CotizadorPanelProps {
  printers: Impresora[];
  spools: Bobina[];
  config: ConfiguracionCostos;
  onOrderCreated: (jobData: any) => Promise<void>;
  showToast: (msg: string) => void;
}

export const CotizadorPanel: React.FC<CotizadorPanelProps> = ({
  printers,
  spools,
  config,
  onOrderCreated,
  showToast,
}) => {
  const [fileName, setFileName] = useState<string>("Bambu_Organizador_Modular_v2.3mf");
  const [clientName, setClientName] = useState<string>("Cliente Particular");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [tipoDestino, setTipoDestino] = useState<"CLIENTE" | "STOCK">("CLIENTE");
  const [cantidad, setCantidad] = useState<number>(1);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number>(printers[0]?.id || 1);
  const [selectedSpoolId, setSelectedSpoolId] = useState<number>(spools[0]?.id || 1);

  const [grams, setGrams] = useState<number>(120);
  const [printTimeMin, setPrintTimeMin] = useState<number>(180);
  const [operatorTimeMin, setOperatorTimeMin] = useState<number>(15);
  const [marginPercent, setMarginPercent] = useState<number>(config.margen_ganancia_default || 150);

  // Slicer parse states
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sliceData, setSliceData] = useState<BambuSliceMetadata | null>(null);
  const [selectedPlateIndex, setSelectedPlateIndex] = useState<number>(1);
  const [materialesAms, setMaterialesAms] = useState<TrabajoMaterialAms[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bobinas con stock real disponible (>0g) para evitar asignar bobinas agotadas
  const activeSpools = useMemo(() => {
    const conStock = spools.filter((s) => s.peso_actual_g > 0);
    return conStock.length > 0 ? conStock : spools;
  }, [spools]);

  // Sync default printer and spool
  useEffect(() => {
    if (printers.length > 0 && !printers.some((p) => p.id === selectedPrinterId)) {
      setSelectedPrinterId(printers[0].id);
    }
  }, [printers, selectedPrinterId]);

  useEffect(() => {
    if (activeSpools.length > 0 && !activeSpools.some((s) => s.id === selectedSpoolId)) {
      setSelectedSpoolId(activeSpools[0].id);
    }
  }, [activeSpools, selectedSpoolId]);

  const currentPrinter = useMemo(
    () => printers.find((p) => p.id === selectedPrinterId) || printers[0] || {
      id: 1,
      nombre: "Bambu Lab P1S",
      consumo_kw: 0.28,
      costo_maquina: 950,
      horas_vida_util: 8000,
    },
    [printers, selectedPrinterId]
  );

  const currentSpool = useMemo(
    () => activeSpools.find((s) => s.id === selectedSpoolId) || spools.find((s) => s.id === selectedSpoolId) || spools[0] || {
      id: 1,
      marca: "eSun",
      material: "PLA+",
      color: "Negro",
      hex: "#1e293b",
      peso_total_g: 1000,
      peso_actual_g: 1000,
      costo_compra: 24,
    },
    [activeSpools, spools, selectedSpoolId]
  );

  // Handle .3mf file upload
  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".3mf")) {
      setParseError("El archivo debe ser un contenedor .3mf de Bambu Studio u OrcaSlicer.");
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const metadata = await parseBambu3mf(file);
      setFileName(metadata.fileName);
      setGrams(metadata.totalWeightGrams);
      setPrintTimeMin(metadata.printTimeMinutes);
      setSliceData(metadata);
      setSelectedPlateIndex(1);

      // Auto-map detected filaments with real spools
      if (metadata.filaments && metadata.filaments.length > 0) {
        const mappedMaterials: TrabajoMaterialAms[] = metadata.filaments.map((fil, idx) => {
          const matched = matchFilamentToSpool(fil, spools);
          const chosenSpool = matched || spools[0];
          const costPerGram = chosenSpool ? chosenSpool.costo_compra / chosenSpool.peso_total_g : 0.024;
          return {
            slot_ams: fil.id || idx + 1,
            color_nombre: fil.type || `Color ${idx + 1}`,
            color_hex: fil.color || "#3b82f6",
            gramos_usados: fil.usedGrams,
            costo_calculado: fil.usedGrams * costPerGram,
            bobinaId: chosenSpool ? chosenSpool.id : 1,
          };
        });
        setMaterialesAms(mappedMaterials);
      } else {
        setMaterialesAms([]);
      }

      showToast(`✓ Archivo analizado: ${metadata.fileName} (${metadata.totalWeightGrams}g, ${metadata.printTimeMinutes} min)`);
    } catch (err: any) {
      console.error("Error al procesar .3mf:", err);
      setParseError(err.message || "Error al procesar el archivo .3mf");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePlateChange = (plateIndex: number) => {
    setSelectedPlateIndex(plateIndex);
    if (sliceData && sliceData.plates) {
      const plate = sliceData.plates.find((p) => p.index === plateIndex);
      if (plate) {
        setGrams(plate.weightGrams);
        setPrintTimeMin(plate.printTimeMinutes);
      }
    }
  };

  const handleChangeMaterialBobina = (index: number, newBobinaId: number) => {
    setMaterialesAms((prev) => {
      const updated = [...prev];
      const spool = spools.find((s) => s.id === newBobinaId);
      const costPerGram = spool ? spool.costo_compra / spool.peso_total_g : 0.024;
      updated[index] = {
        ...updated[index],
        bobinaId: newBobinaId,
        costo_calculado: updated[index].gramos_usados * costPerGram,
      };
      return updated;
    });
  };

  // Financial calculations (Unitary vs. Batch Total)
  const totalGrams = grams * cantidad;
  const totalPrintTimeMin = printTimeMin * cantidad;

  const calculations = useMemo(() => {
    let costFilament = 0;
    let hasSufficientStock = true;
    let stockDifference = 0;

    if (materialesAms.length > 0) {
      costFilament = materialesAms.reduce((acc, m) => acc + m.costo_calculado * cantidad, 0);
      for (const m of materialesAms) {
        const s = spools.find((sp) => sp.id === m.bobinaId);
        const reqGrams = m.gramos_usados * cantidad;
        if (s && s.peso_actual_g < reqGrams) {
          hasSufficientStock = false;
          stockDifference += s.peso_actual_g - reqGrams;
        }
      }
    } else {
      const costPerGram = currentSpool.costo_compra / (currentSpool.peso_total_g || 1000);
      costFilament = totalGrams * costPerGram;
      hasSufficientStock = currentSpool.peso_actual_g >= totalGrams;
      stockDifference = currentSpool.peso_actual_g - totalGrams;
    }

    const printHours = totalPrintTimeMin / 60.0;
    const operatorHours = operatorTimeMin / 60.0;
    const costElectricity = currentPrinter.consumo_kw * printHours * config.costo_kwh;
    const hourlyAmortization = currentPrinter.costo_maquina / (currentPrinter.horas_vida_util || 8000);
    const costMachine = hourlyAmortization * printHours;
    const costLabor = operatorHours * config.costo_hora_operador;
    const totalCost = costFilament + costElectricity + costMachine + costLabor;
    const suggestedPrice = totalCost * (1 + marginPercent / 100.0);
    const netProfit = suggestedPrice - totalCost;

    const unitCost = totalCost / (cantidad || 1);
    const unitPrice = suggestedPrice / (cantidad || 1);
    const unitProfit = netProfit / (cantidad || 1);

    return {
      costFilament,
      costElectricity,
      costMachine,
      costLabor,
      totalCost,
      suggestedPrice,
      netProfit,
      unitCost,
      unitPrice,
      unitProfit,
      printHours,
      operatorHours,
      hasSufficientStock,
      stockDifference,
    };
  }, [
    materialesAms,
    spools,
    currentSpool,
    totalGrams,
    totalPrintTimeMin,
    operatorTimeMin,
    currentPrinter,
    config,
    marginPercent,
    cantidad,
  ]);

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        nombre_archivo: fileName,
        cliente: tipoDestino === "STOCK" ? "Stock Granja (Taller)" : clientName || "Cliente Particular",
        cliente_telefono: tipoDestino === "STOCK" ? null : clientPhone || null,
        cantidad: cantidad,
        tipo_destino: tipoDestino,
        impresoraId: selectedPrinterId,
        impresora_asignada: currentPrinter.nombre,
        material: materialesAms.length > 0 ? "Multi-Material AMS" : currentSpool.material,
        color: materialesAms.length > 0 ? `${materialesAms.length} Colores` : currentSpool.color,
        color_hex: currentSpool.hex,
        estado: "EN_ESPERA",
        prioridad: "MEDIA",
        tiempo_minutos: totalPrintTimeMin,
        tiempo_operador_min: operatorTimeMin,
        gramos_filamento: totalGrams,
        costo_energia: calculations.costElectricity,
        costo_operador: calculations.costLabor,
        costo_filamento: calculations.costFilament,
        costo_amortizacion: calculations.costMachine,
        costo_total: calculations.totalCost,
        precio_venta: calculations.suggestedPrice,
        ganancia_neta: calculations.netProfit,
        margen_porcentaje: marginPercent,
        materiales_ams:
          materialesAms.length > 0
            ? materialesAms.map((m) => ({
                bobinaId: m.bobinaId,
                slot_ams: m.slot_ams,
                color_nombre: m.color_nombre,
                color_hex: m.color_hex,
                gramos_usados: m.gramos_usados * cantidad,
                costo_calculado: m.costo_calculado * cantidad,
              }))
            : [
                {
                  bobinaId: selectedSpoolId,
                  slot_ams: 1,
                  color_nombre: currentSpool.color,
                  color_hex: currentSpool.hex,
                  gramos_usados: totalGrams,
                  costo_calculado: calculations.costFilament,
                },
              ],
      };

      await onOrderCreated(orderPayload);
      showToast(`✓ ¡Orden registrada (${cantidad} unidad${cantidad > 1 ? "es" : ""}) en cola de producción!`);
    } catch (err: any) {
      console.error("Error confirmando orden:", err);
      alert("Error al registrar orden: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone & File parsing header */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleProcessFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : "border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-600"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".3mf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleProcessFile(f);
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-lg">
            {isParsing ? (
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Arrastra tu archivo .3mf de Bambu Studio aquí
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Lee automáticamente las placas, tiempos estimados, consumo de filamento y colores AMS.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800">
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>Archivo actual: </span>
            <strong className="text-zinc-200">{fileName}</strong>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Multi-plate selector if applicable */}
      {sliceData && sliceData.plates && sliceData.plates.length > 1 && (
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" /> Placas detectadas:
          </span>
          {sliceData.plates.map((p) => (
            <button
              key={p.index}
              onClick={() => handlePlateChange(p.index)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPlateIndex === p.index
                  ? "bg-emerald-500 text-zinc-950 font-bold"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              Placa #{p.index} ({p.weightGrams}g - {p.printTimeMinutes}m)
            </button>
          ))}
        </div>
      )}

      {/* Multi-Color AMS mapper if multi-filament detected */}
      {materialesAms.length > 0 && (
        <MultiColorAmsMapper
          detectedFilaments={sliceData?.filaments || []}
          spools={activeSpools}
          materialesAms={materialesAms}
          onChangeMaterial={handleChangeMaterialBobina}
        />
      )}

      {/* Main Grid: Parameters Form & Cost Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Parameters & Config */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" /> Parámetros de Fabricación & Lote
              </h3>

              {/* Selector de Destino: Cliente vs Stock */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTipoDestino("CLIENTE")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tipoDestino === "CLIENTE"
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Contra Pedido
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDestino("STOCK")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tipoDestino === "STOCK"
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Para Stock Taller
                </button>
              </div>
            </div>

            {/* Selector de Cantidad de Piezas (Lote) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-900/90 border border-emerald-500/30 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" /> Cantidad de Unidades a Imprimir
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Multiplica proporcionalmente el filamento, tiempo de máquina y costos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 text-center bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCantidad((prev) => prev + 1)}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[1, 2, 3, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCantidad(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          cantidad === preset
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-zinc-800/60 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {preset}u
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {cantidad > 1 && (
                <div className="text-[11px] text-emerald-400/90 font-medium pt-1 border-t border-zinc-800/80 flex items-center justify-between">
                  <span>Total lote: {cantidad} unidades</span>
                  <span>
                    Consumo: {totalGrams}g totales • {(totalPrintTimeMin / 60).toFixed(1)}h máquina
                  </span>
                </div>
              )}
            </div>

            {/* Client Info (Visible solo si es contra pedido) */}
            {tipoDestino === "CLIENTE" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Cliente / Empresa
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Particular - Juan"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ej. +54 261 5566778"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>
                  <strong>Producción interna de taller:</strong> Las piezas terminadas ingresarán al stock del taller con disponibilidad inmediata para ser vendidas posteriormente.
                </span>
              </div>
            )}

            {/* Printer Selection */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Impresora Designada
              </label>
              <select
                value={selectedPrinterId}
                onChange={(e) => setSelectedPrinterId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.consumo_kw} kW - Estado: {p.estado || "DISPONIBLE"})
                  </option>
                ))}
              </select>
            </div>

            {/* Single Spool selection fallback if no multi-color detected */}
            {materialesAms.length === 0 && (
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Bobina de Filamento Primaria (Solo con stock activo)
                </label>
                <select
                  value={selectedSpoolId}
                  onChange={(e) => setSelectedSpoolId(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {activeSpools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.marca} {s.material} - {s.color} (Stock disponible: {s.peso_actual_g}g / ${s.costo_compra})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Numeric inputs: Unitary Grams, Print Time, Operator Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Peso / unidad (g)
                </label>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                />
                {cantidad > 1 && (
                  <span className="text-[10px] text-zinc-500">
                    Total lote: {totalGrams}g
                  </span>
                )}
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Tiempo / u. (min)
                </label>
                <input
                  type="number"
                  value={printTimeMin}
                  onChange={(e) => setPrintTimeMin(Number(e.target.value))}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500">
                  {cantidad > 1 ? `Lote: ${(totalPrintTimeMin / 60).toFixed(1)}h` : `≈ ${(printTimeMin / 60).toFixed(1)}h`}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                  Operador (min)
                </label>
                <input
                  type="number"
                  value={operatorTimeMin}
                  onChange={(e) => setOperatorTimeMin(Number(e.target.value))}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500">Preparación / retiro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Financial Summary Card */}
        <div className="lg:col-span-5">
          <ResumenCostosCard
            costFilament={calculations.costFilament}
            costElectricity={calculations.costElectricity}
            costMachine={calculations.costMachine}
            costLabor={calculations.costLabor}
            totalCost={calculations.totalCost}
            suggestedPrice={calculations.suggestedPrice}
            netProfit={calculations.netProfit}
            marginPercent={marginPercent}
            setMarginPercent={setMarginPercent}
            printHours={calculations.printHours}
            operatorHours={calculations.operatorHours}
            hasSufficientStock={calculations.hasSufficientStock}
            stockDifference={calculations.stockDifference}
            onConfirmOrder={handleConfirmOrder}
            isSubmitting={isSubmitting}
            cantidad={cantidad}
            unitCost={calculations.unitCost}
            unitPrice={calculations.unitPrice}
            unitProfit={calculations.unitProfit}
          />
        </div>
      </div>
    </div>
  );
};
