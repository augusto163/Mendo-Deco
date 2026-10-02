"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Upload,
  Layers,
  Printer,
  Scale,
  Clock,
  User,
  Phone,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  FileText,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import {
  parseBambu3mf,
  BambuSliceMetadata,
  matchFilamentToSpool,
} from "@/utils/bambuParser";
import {
  Impresora,
  Bobina,
  ConfiguracionCostos,
} from "../types";
import {
  MaterialSlotUI,
  PresupuestoCalculadoResponse,
  CotizacionCreadaResponse,
  ItemCalculoDTO,
} from "./types";
import { MultiColorAmsMapper } from "./MultiColorAmsMapper";
import { ResumenCostosCard } from "./ResumenCostosCard";

interface CotizadorPanelProps {
  printers: Impresora[];
  spools: Bobina[];
  config: ConfiguracionCostos;
  onCotizacionCreated?: (cotizacion: CotizacionCreadaResponse) => void;
  showToast: (msg: string) => void;
}

export const CotizadorPanel: React.FC<CotizadorPanelProps> = ({
  printers,
  spools,
  config,
  onCotizacionCreated,
  showToast,
}) => {
  // Form input states
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
  const [marginPercent, setMarginPercent] = useState<number>(config?.margen_ganancia_default || 150);
  const [descuentoPercent, setDescuentoPercent] = useState<number>(0);
  const [notas, setNotas] = useState<string>("");

  // Slicer parse states
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sliceData, setSliceData] = useState<BambuSliceMetadata | null>(null);
  const [selectedPlateIndex, setSelectedPlateIndex] = useState<number>(1);
  const [materialesAms, setMaterialesAms] = useState<MaterialSlotUI[]>([]);

  // Calculation states (Backend official response)
  const [calculo, setCalculo] = useState<PresupuestoCalculadoResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculoError, setCalculoError] = useState<string | null>(null);

  // Submission & Post-Creation states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cotizacionCreada, setCotizacionCreada] = useState<CotizacionCreadaResponse | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [pedidoGenerado, setPedidoGenerado] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bobinas con stock real disponible (>0g) para el selector
  const activeSpools = useMemo(() => {
    const conStock = spools.filter((s) => s.peso_actual_g > 0);
    return conStock.length > 0 ? conStock : spools;
  }, [spools]);

  // Sincronizar impresora por defecto
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

  // Procesamiento del archivo .3MF
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

      // Mapear filamentos detectados a slots AMS
      if (metadata.filaments && metadata.filaments.length > 0) {
        const mappedMaterials: MaterialSlotUI[] = metadata.filaments.map((fil, idx) => {
          const matched = matchFilamentToSpool(fil, spools);
          const chosenSpool = matched || spools[0];
          return {
            slot_ams: fil.id || idx + 1,
            color_nombre: fil.type || `Color ${idx + 1}`,
            color_hex: fil.color || "#3b82f6",
            tipo_material: fil.type || "PLA",
            gramos_usados: fil.usedGrams,
            bobinaId: chosenSpool ? chosenSpool.id : (spools[0]?.id || 1),
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
      updated[index] = {
        ...updated[index],
        bobinaId: newBobinaId,
      };
      return updated;
    });
  };

  // Construir el ItemCalculoDTO para la API
  const construirItemCalculo = useCallback((): ItemCalculoDTO => {
    const desc = fileName + (sliceData?.plates && sliceData.plates.length > 1 ? ` (Placa #${selectedPlateIndex})` : "");

    const materiales = materialesAms.length > 0
      ? materialesAms.map((m) => {
          const spool = spools.find((s) => s.id === m.bobinaId);
          const costoGramoRef = spool?.costo_gramo
            ? Number(spool.costo_gramo)
            : (spool ? spool.costo_compra / (spool.peso_total_g || 1000) : 0.04);

          return {
            filamentoId: m.filamentoId || null,
            colorNombre: m.color_nombre,
            colorHex: m.color_hex,
            tipoMaterial: m.tipo_material,
            gramosUsados: m.gramos_usados,
            slotAms: m.slot_ams,
            costoGramoReferencia: costoGramoRef,
          };
        })
      : [
          {
            filamentoId: null,
            colorNombre: currentSpool.color,
            colorHex: currentSpool.hex,
            tipoMaterial: currentSpool.material,
            gramosUsados: grams,
            slotAms: 1,
            costoGramoReferencia: currentSpool?.costo_gramo
              ? Number(currentSpool.costo_gramo)
              : currentSpool.costo_compra / (currentSpool.peso_total_g || 1000),
          },
        ];

    return {
      descripcion: desc,
      cantidad: Math.max(1, cantidad),
      tiempoMinutosUnitario: Math.max(1, printTimeMin),
      tiempoOperadorMinutos: Math.max(0, operatorTimeMin),
      impresoraId: selectedPrinterId,
      margenPorcentaje: marginPercent,
      materiales,
    };
  }, [
    fileName,
    sliceData,
    selectedPlateIndex,
    materialesAms,
    spools,
    currentSpool,
    grams,
    cantidad,
    printTimeMin,
    operatorTimeMin,
    selectedPrinterId,
    marginPercent,
  ]);

  // Llamada a POST /api/cotizaciones/calcular con debounce
  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsCalculating(true);
      setCalculoError(null);
      try {
        const itemDTO = construirItemCalculo();
        const res = await fetch("/api/cotizaciones/calcular", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descuentoPorcentaje: descuentoPercent,
            items: [itemDTO],
          }),
        });

        const json = await res.json();
        if (!isCancelled) {
          if (json.success && json.data) {
            setCalculo(json.data);

            // Si la respuesta incluye desglose de materiales, actualizar el costo calculado en UI
            if (json.data.items?.[0]?.materiales && materialesAms.length > 0) {
              setMaterialesAms((prev) =>
                prev.map((m, idx) => ({
                  ...m,
                  costo_calculado: json.data.items[0].materiales[idx]?.costo_calculado,
                }))
              );
            }
          } else {
            setCalculoError(json.error || "Error al calcular presupuesto");
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Error en /api/cotizaciones/calcular:", err);
          setCalculoError(err.message || "Error de conexión con el calculador");
        }
      } finally {
        if (!isCancelled) setIsCalculating(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [construirItemCalculo, descuentoPercent]);

  // Verificación de disponibilidad de filamento en stock
  const totalGrams = grams * cantidad;
  const totalPrintTimeMin = printTimeMin * cantidad;

  const stockCheck = useMemo(() => {
    let hasSufficientStock = true;
    let stockDifference = 0;

    if (materialesAms.length > 0) {
      for (const m of materialesAms) {
        const s = spools.find((sp) => sp.id === m.bobinaId);
        const reqGrams = m.gramos_usados * cantidad;
        if (s && s.peso_actual_g < reqGrams) {
          hasSufficientStock = false;
          stockDifference += s.peso_actual_g - reqGrams;
        }
      }
    } else {
      hasSufficientStock = currentSpool.peso_actual_g >= totalGrams;
      stockDifference = currentSpool.peso_actual_g - totalGrams;
    }

    return { hasSufficientStock, stockDifference };
  }, [materialesAms, spools, currentSpool, totalGrams, cantidad]);

  // Guardar Cotización oficial en BORRADOR
  const handleCrearCotizacion = async () => {
    setIsSubmitting(true);
    try {
      const itemDTO = construirItemCalculo();
      const payload = {
        clienteNombreSnapshot: tipoDestino === "STOCK" ? "Stock Granja (Taller)" : clientName.trim() || "Cliente Particular",
        clienteTelefonoSnapshot: tipoDestino === "STOCK" ? null : clientPhone.trim() || null,
        notas: notas.trim() || null,
        descuentoPorcentaje: descuentoPercent,
        items: [itemDTO],
      };

      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "No se pudo registrar la cotización");
      }

      setCotizacionCreada(json.data);
      showToast(`✓ Cotización ${json.data.codigo_cotizacion} registrada en estado BORRADOR.`);

      if (onCotizacionCreated) {
        onCotizacionCreated(json.data);
      }
    } catch (err: any) {
      console.error("Error al guardar cotización:", err);
      alert("Error al registrar cotización: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Acción explícita para aprobar la cotización y generar pedido
  const handleAprobarYCrearPedido = async () => {
    if (!cotizacionCreada) return;
    setIsApproving(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cotizacionId: cotizacionCreada.id,
          notas: `Generado desde cotización ${cotizacionCreada.codigo_cotizacion}`,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "No se pudo generar el pedido");
      }

      setPedidoGenerado(json.data);
      showToast(`🚀 ¡Pedido ${json.data.codigo_pedido} creado exitosamente a partir de la cotización!`);
    } catch (err: any) {
      console.error("Error al aprobar cotización:", err);
      alert("Error al generar pedido: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReiniciarCotizador = () => {
    setCotizacionCreada(null);
    setPedidoGenerado(null);
  };

  return (
    <div className="space-y-6">
      {/* Vista de Éxito / Cotización Creada (Paso 6) */}
      {cotizacionCreada ? (
        <div className="bg-zinc-900/90 rounded-2xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Cotización Registrada
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {cotizacionCreada.estado}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Código oficial: <strong className="text-emerald-400 font-mono">{cotizacionCreada.codigo_cotizacion}</strong> • Fecha: {new Date(cotizacionCreada.fecha_emision).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-zinc-400 block">Total Cotizado</span>
              <span className="text-2xl font-black text-emerald-400">
                ${Number(cotizacionCreada.precio_final).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 block font-medium">Cliente</span>
              <strong className="text-zinc-200 text-sm block">
                {cotizacionCreada.cliente_nombre_snapshot}
              </strong>
              {cotizacionCreada.cliente_telefono_snapshot && (
                <span className="text-zinc-400 block">{cotizacionCreada.cliente_telefono_snapshot}</span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 block font-medium">Parámetros de Fabricación</span>
              <span className="text-zinc-200 block">
                Archivo: <strong>{fileName}</strong>
              </span>
              <span className="text-zinc-400 block">
                Lote: {cantidad} unidad(es) • {totalGrams}g totales • {(totalPrintTimeMin / 60).toFixed(1)}h
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 block font-medium">Rentabilidad Registrada</span>
              <span className="text-zinc-200 block">
                Costo Total: ${Number(cotizacionCreada.costo_total_calculado).toFixed(2)}
              </span>
              <span className="text-emerald-400 font-semibold block">
                Margen asignado: +{marginPercent}% (Subtotal: ${Number(cotizacionCreada.precio_subtotal).toFixed(2)})
              </span>
            </div>
          </div>

          {/* Acciones del flujo comercial */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReiniciarCotizador}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cotizar otra pieza (.3MF)</span>
            </button>

            {pedidoGenerado ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pedido comercial generado: <strong>{pedidoGenerado.codigo_pedido}</strong></span>
              </div>
            ) : (
              <button
                onClick={handleAprobarYCrearPedido}
                disabled={isApproving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isApproving ? (
                  <span>Generando pedido...</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Aprobar Cotización y Crear Pedido Comercial</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
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
                  Arrastra tu archivo .3mf de Bambu Studio u OrcaSlicer aquí
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Lee automáticamente placas, tiempos de impresión, consumo en gramos y slots AMS.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <span>Archivo cargado: </span>
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

          {/* Selector de Placas si el proyecto tiene múltiples placas */}
          {sliceData && sliceData.plates && sliceData.plates.length > 1 && (
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex items-center gap-3 overflow-x-auto">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" /> Placas detectadas:
              </span>
              {sliceData.plates.map((p) => (
                <button
                  key={p.index}
                  onClick={() => handlePlateChange(p.index)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

          {/* Mapeo Multi-Material AMS si se detectaron filamentos */}
          {materialesAms.length > 0 && (
            <MultiColorAmsMapper
              detectedFilaments={sliceData?.filaments || []}
              spools={activeSpools}
              materialesAms={materialesAms}
              onChangeMaterial={handleChangeMaterialBobina}
            />
          )}

          {/* Grid Principal: Parámetros a la izquierda, Resumen a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-400" /> Parámetros de Cotización
                  </h3>

                  {/* Selector de Destino */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setTipoDestino("CLIENTE")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tipoDestino === "CLIENTE"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Para Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDestino("STOCK")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tipoDestino === "STOCK"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Stock Taller
                    </button>
                  </div>
                </div>

                {/* Cantidad de piezas (Lote) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-900/90 border border-emerald-500/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" /> Cantidad de Unidades a Cotizar
                      </label>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Calcula automáticamente el total para lotes de piezas.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-950 border border-zinc-700/80 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm cursor-pointer"
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
                          className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="hidden sm:flex items-center gap-1">
                        {[1, 2, 3, 5, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCantidad(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
                        Consumo: {totalGrams.toFixed(1)}g totales • {(totalPrintTimeMin / 60).toFixed(1)}h máquina
                      </span>
                    </div>
                  )}
                </div>

                {/* Datos del Cliente */}
                {tipoDestino === "CLIENTE" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Cliente / Razón Social
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
                      <strong>Producción para Stock Taller:</strong> La cotización se emitirá a nombre del taller para posterior ingreso de inventario disponible.
                    </span>
                  </div>
                )}

                {/* Selección de Impresora */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Impresora Asignada (determina consumo eléctrico y amortización)
                  </label>
                  <select
                    value={selectedPrinterId}
                    onChange={(e) => setSelectedPrinterId(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {printers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.consumo_kw} kW - {p.horas_vida_util}h vida útil)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selección de Bobina única (si es monomaterial) */}
                {materialesAms.length === 0 && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Filamento / Bobina Primaria
                    </label>
                    <select
                      value={selectedSpoolId}
                      onChange={(e) => setSelectedSpoolId(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {activeSpools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.marca} {s.material} - {s.color} (Stock: {s.peso_actual_g}g / $
                          {s.costo_gramo ? Number(s.costo_gramo).toFixed(3) : (s.costo_compra / (s.peso_total_g || 1000)).toFixed(3)}/g)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Parámetros Técnicos Unitarios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" /> Peso / u. (g)
                    </label>
                    <input
                      type="number"
                      value={grams}
                      onChange={(e) => setGrams(Number(e.target.value))}
                      className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
                    />
                    {cantidad > 1 && (
                      <span className="text-[10px] text-zinc-500">
                        Lote: {totalGrams.toFixed(1)}g
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
                    <span className="text-[10px] text-zinc-500">Mano de obra</span>
                  </div>
                </div>

                {/* Notas de la cotización */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Notas u Observaciones del Pedido
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej. Calidad 0.20mm, entrega pactada viernes..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Desglose Financiero */}
            <div className="lg:col-span-5">
              <ResumenCostosCard
                calculo={calculo}
                isCalculating={isCalculating}
                marginPercent={marginPercent}
                setMarginPercent={setMarginPercent}
                descuentoPercent={descuentoPercent}
                setDescuentoPercent={setDescuentoPercent}
                tiempoTotalMinutos={totalPrintTimeMin}
                tiempoOperadorMinutos={operatorTimeMin}
                gramosTotales={totalGrams}
                hasSufficientStock={stockCheck.hasSufficientStock}
                stockDifference={stockCheck.stockDifference}
                onCrearCotizacion={handleCrearCotizacion}
                isSubmitting={isSubmitting}
                cantidad={cantidad}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
