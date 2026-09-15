"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Layers,
  Package,
  Calculator,
  Disc,
  Scale,
  DollarSign,
  AlertTriangle,
  FileCode,
  CheckCircle,
  Clock,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Zap,
  Wrench,
  User,
  Check,
  Loader2,
  FileCheck2,
  Printer,
  Activity,
  PlusCircle,
  Plus,
  X,
  Play,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Coins,
  BadgeDollarSign,
  Receipt,
  PieChart,
  LineChart,
  Inbox,
} from "lucide-react";
import { parseBambu3mf, BambuSliceMetadata } from "@/utils/bambuParser";

// ==========================================
// TYPES
// ==========================================
export interface ConfiguracionCostos {
  id: number;
  costo_kwh: number;
  costo_hora_operador: number;
  margen_ganancia_default: number;
}

export interface Impresora {
  id: number;
  nombre: string;
  consumo_kw: number;
  costo_maquina: number;
  horas_vida_util: number;
}

export interface Bobina {
  id: number;
  marca: string;
  material: string;
  color: string;
  hex: string;
  peso_total_g: number;
  peso_actual_g: number;
  costo_compra: number;
}

export interface ActivoInversion {
  id: number;
  nombre: string;
  costo: number;
  categoria: "maquinaria" | "herramientas" | "insumos";
  fecha?: string;
}

export interface Trabajo {
  id: number;
  codigo: string;
  nombre: string;
  cliente: string;
  impresoraId: number;
  bobinaId: number;
  pesoGramos: number;
  tiempoMinutos: number;
  tiempoTranscurridoMin: number;
  estado: "ejecucion" | "espera" | "completado";
  costoFilamento: number;
  costoElectricidad: number;
  costoAmortizacion: number;
  costoManoObra: number;
  costoTotal: number;
  precioVenta: number;
  gananciaNeta: number;
  fecha: string;
  prioridad: "alta" | "media" | "baja";
}

// ==========================================
// INITIAL MOCK DATA
// ==========================================
const INITIAL_CONFIG: ConfiguracionCostos = {
  id: 1,
  costo_kwh: 0.15,
  costo_hora_operador: 8.0,
  margen_ganancia_default: 150.0,
};

const INITIAL_PRINTERS: Impresora[] = [
  { id: 1, nombre: "Bambu Lab P1S (AMS 1)", consumo_kw: 0.28, costo_maquina: 950.0, horas_vida_util: 8000 },
  { id: 2, nombre: "Bambu Lab X1-Carbon (AMS 2)", consumo_kw: 0.35, costo_maquina: 1500.0, horas_vida_util: 10000 },
  { id: 3, nombre: "Bambu Lab A1 Mini (Bed Slinger)", consumo_kw: 0.15, costo_maquina: 400.0, horas_vida_util: 6000 },
];

const INITIAL_SPOOLS: Bobina[] = [
  { id: 1, marca: "eSun", material: "PLA+", color: "Negro Sólido", hex: "#18181b", peso_total_g: 1000, peso_actual_g: 850, costo_compra: 22.0 },
  { id: 2, marca: "Grilon3", material: "PETG", color: "Blanco Puro", hex: "#f4f4f5", peso_total_g: 1000, peso_actual_g: 140, costo_compra: 20.0 },
  { id: 3, marca: "Bambu Lab", material: "PLA Basic", color: "Verde Bambu", hex: "#00ae42", peso_total_g: 1000, peso_actual_g: 620, costo_compra: 26.0 },
  { id: 4, marca: "eSun", material: "Silk PLA", color: "Oro Metalizado", hex: "#eab308", peso_total_g: 1000, peso_actual_g: 380, costo_compra: 28.0 },
];

const INITIAL_INVERSION: ActivoInversion[] = [
  { id: 1, nombre: "Bambu Lab P1S + AMS (Combo)", costo: 950.0, categoria: "maquinaria", fecha: "2026-08-01" },
  { id: 2, nombre: "Bambu Lab X1-Carbon + AMS (Combo)", costo: 1500.0, categoria: "maquinaria", fecha: "2026-08-01" },
  { id: 3, nombre: "Bambu Lab A1 Mini (Bed Slinger)", costo: 400.0, categoria: "maquinaria", fecha: "2026-08-15" },
  { id: 4, nombre: "Placas PEI Texturadas Bambu (x3)", costo: 90.0, categoria: "herramientas" },
  { id: 5, nombre: "Kit Boquillas Acero Endurecido 0.4/0.6mm", costo: 45.0, categoria: "herramientas" },
  { id: 6, nombre: "Secador de Filamento Sunlu S2", costo: 65.0, categoria: "herramientas" },
  { id: 7, nombre: "Mesa de Trabajo Reforzada & Herramientas", costo: 80.0, categoria: "herramientas" },
  { id: 8, nombre: "Lote Inicial 4 Bobinas Filamento (4 kg)", costo: 96.0, categoria: "insumos" },
];

const INITIAL_TRABAJOS: Trabajo[] = [
  {
    id: 101,
    codigo: "TRB-101",
    nombre: "Bambu_Organizador_Modular_v2.3mf",
    cliente: "Estudio Delta Diseño",
    impresoraId: 1,
    bobinaId: 3,
    pesoGramos: 120,
    tiempoMinutos: 180,
    tiempoTranscurridoMin: 126,
    estado: "ejecucion",
    costoFilamento: 3.12,
    costoElectricidad: 0.13,
    costoAmortizacion: 0.36,
    costoManoObra: 2.0,
    costoTotal: 5.61,
    precioVenta: 14.03,
    gananciaNeta: 8.42,
    fecha: "2026-09-14",
    prioridad: "alta",
  },
  {
    id: 102,
    codigo: "TRB-102",
    nombre: "Carcasa_Dron_FPV_Racing.3mf",
    cliente: "AeroModelismo Mendoza",
    impresoraId: 2,
    bobinaId: 2,
    pesoGramos: 85,
    tiempoMinutos: 135,
    tiempoTranscurridoMin: 54,
    estado: "ejecucion",
    costoFilamento: 1.7,
    costoElectricidad: 0.12,
    costoAmortizacion: 0.34,
    costoManoObra: 1.6,
    costoTotal: 3.76,
    precioVenta: 10.5,
    gananciaNeta: 6.74,
    fecha: "2026-09-14",
    prioridad: "media",
  },
  {
    id: 103,
    codigo: "TRB-103",
    nombre: "Lote_Llaveros_Corporativos_x50.3mf",
    cliente: "Bodega Los Andes",
    impresoraId: 1,
    bobinaId: 4,
    pesoGramos: 175,
    tiempoMinutos: 220,
    tiempoTranscurridoMin: 0,
    estado: "espera",
    costoFilamento: 4.9,
    costoElectricidad: 0.15,
    costoAmortizacion: 0.44,
    costoManoObra: 2.8,
    costoTotal: 8.29,
    precioVenta: 24.5,
    gananciaNeta: 16.21,
    fecha: "2026-09-14",
    prioridad: "alta",
  },
  {
    id: 104,
    codigo: "TRB-104",
    nombre: "Soporte_Auriculares_Bambu_Desk.3mf",
    cliente: "Particular - Juan M.",
    impresoraId: 3,
    bobinaId: 1,
    pesoGramos: 95,
    tiempoMinutos: 110,
    tiempoTranscurridoMin: 0,
    estado: "espera",
    costoFilamento: 2.09,
    costoElectricidad: 0.04,
    costoAmortizacion: 0.12,
    costoManoObra: 1.5,
    costoTotal: 3.75,
    precioVenta: 11.2,
    gananciaNeta: 7.45,
    fecha: "2026-09-14",
    prioridad: "baja",
  },
  {
    id: 95,
    codigo: "TRB-095",
    nombre: "Maqueta_Arquitectura_Fachada.3mf",
    cliente: "Arq. Gomez & Asoc.",
    impresoraId: 2,
    bobinaId: 2,
    pesoGramos: 310,
    tiempoMinutos: 490,
    tiempoTranscurridoMin: 490,
    estado: "completado",
    costoFilamento: 6.2,
    costoElectricidad: 0.43,
    costoAmortizacion: 1.23,
    costoManoObra: 5.0,
    costoTotal: 12.86,
    precioVenta: 38.5,
    gananciaNeta: 25.64,
    fecha: "2026-09-13",
    prioridad: "alta",
  },
  {
    id: 94,
    codigo: "TRB-094",
    nombre: "Caja_Electronica_Estanca_IP65.3mf",
    cliente: "SensorTech Cuyo",
    impresoraId: 1,
    bobinaId: 2,
    pesoGramos: 140,
    tiempoMinutos: 190,
    tiempoTranscurridoMin: 190,
    estado: "completado",
    costoFilamento: 2.8,
    costoElectricidad: 0.13,
    costoAmortizacion: 0.38,
    costoManoObra: 2.2,
    costoTotal: 5.51,
    precioVenta: 16.0,
    gananciaNeta: 10.49,
    fecha: "2026-09-12",
    prioridad: "media",
  },
  {
    id: 93,
    codigo: "TRB-093",
    nombre: "Lampara_Litofania_Personalizada.3mf",
    cliente: "Regalos Mza",
    impresoraId: 3,
    bobinaId: 1,
    pesoGramos: 160,
    tiempoMinutos: 280,
    tiempoTranscurridoMin: 280,
    estado: "completado",
    costoFilamento: 3.52,
    costoElectricidad: 0.11,
    costoAmortizacion: 0.31,
    costoManoObra: 3.0,
    costoTotal: 6.94,
    precioVenta: 22.0,
    gananciaNeta: 15.06,
    fecha: "2026-09-11",
    prioridad: "media",
  },
  {
    id: 92,
    codigo: "TRB-092",
    nombre: "Engranaje_Helicoidal_Torno.3mf",
    cliente: "Mecánica Rossi",
    impresoraId: 2,
    bobinaId: 2,
    pesoGramos: 75,
    tiempoMinutos: 105,
    tiempoTranscurridoMin: 105,
    estado: "completado",
    costoFilamento: 1.5,
    costoElectricidad: 0.09,
    costoAmortizacion: 0.26,
    costoManoObra: 1.5,
    costoTotal: 3.35,
    precioVenta: 12.0,
    gananciaNeta: 8.65,
    fecha: "2026-09-10",
    prioridad: "alta",
  },
  {
    id: 91,
    codigo: "TRB-091",
    nombre: "Maceta_Geometrica_Facetada_x4.3mf",
    cliente: "Vivero El Manantial",
    impresoraId: 1,
    bobinaId: 3,
    pesoGramos: 380,
    tiempoMinutos: 520,
    tiempoTranscurridoMin: 520,
    estado: "completado",
    costoFilamento: 9.88,
    costoElectricidad: 0.36,
    costoAmortizacion: 1.03,
    costoManoObra: 4.5,
    costoTotal: 15.77,
    precioVenta: 44.0,
    gananciaNeta: 28.23,
    fecha: "2026-09-06",
    prioridad: "baja",
  },
  {
    id: 90,
    codigo: "TRB-090",
    nombre: "Prototipo_Ergonomico_Scanner.3mf",
    cliente: "Logística Andina",
    impresoraId: 2,
    bobinaId: 1,
    pesoGramos: 110,
    tiempoMinutos: 150,
    tiempoTranscurridoMin: 150,
    estado: "completado",
    costoFilamento: 2.42,
    costoElectricidad: 0.13,
    costoAmortizacion: 0.38,
    costoManoObra: 2.0,
    costoTotal: 4.93,
    precioVenta: 15.5,
    gananciaNeta: 10.57,
    fecha: "2026-09-04",
    prioridad: "media",
  },
  {
    id: 85,
    codigo: "TRB-085",
    nombre: "Trofeos_Torneo_Padel_x3.3mf",
    cliente: "Club Los Cerros",
    impresoraId: 1,
    bobinaId: 4,
    pesoGramos: 240,
    tiempoMinutos: 330,
    tiempoTranscurridoMin: 330,
    estado: "completado",
    costoFilamento: 6.72,
    costoElectricidad: 0.23,
    costoAmortizacion: 0.65,
    costoManoObra: 4.0,
    costoTotal: 11.6,
    precioVenta: 35.0,
    gananciaNeta: 23.4,
    fecha: "2026-09-02",
    prioridad: "alta",
  },
  {
    id: 80,
    codigo: "TRB-080",
    nombre: "Soporte_GoPro_Casco_Enduro.3mf",
    cliente: "Moto Mendoza",
    impresoraId: 3,
    bobinaId: 2,
    pesoGramos: 55,
    tiempoMinutos: 75,
    tiempoTranscurridoMin: 75,
    estado: "completado",
    costoFilamento: 1.1,
    costoElectricidad: 0.03,
    costoAmortizacion: 0.08,
    costoManoObra: 1.0,
    costoTotal: 2.21,
    precioVenta: 8.5,
    gananciaNeta: 6.29,
    fecha: "2026-08-28",
    prioridad: "baja",
  },
];

export default function BambuFarmDashboard() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"jobs" | "finance" | "calculator" | "inventory">("jobs");
  const [periodoFiltro, setPeriodoFiltro] = useState<"general" | "semana" | "mes">("semana");
  const [chartMode, setChartMode] = useState<"daily" | "cumulative">("daily");

  // State
  const [config, setConfig] = useState<ConfiguracionCostos>(INITIAL_CONFIG);
  const [printers] = useState<Impresora[]>(INITIAL_PRINTERS);
  const [spools, setSpools] = useState<Bobina[]>(INITIAL_SPOOLS);
  const [inversiones, setInversiones] = useState<ActivoInversion[]>(INITIAL_INVERSION);
  const [trabajos, setTrabajos] = useState<Trabajo[]>(INITIAL_TRABAJOS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sincronización en vivo con Base de Datos Supabase
  useEffect(() => {
    async function loadDataFromSupabase() {
      try {
        setIsSyncing(true);
        // 1. Cargar Bobinas
        const resFilamentos = await fetch("/api/filamentos");
        const jsonFilamentos = await resFilamentos.json();
        if (jsonFilamentos.success && jsonFilamentos.data?.length > 0) {
          const dbSpools: Bobina[] = jsonFilamentos.data.map((b: any) => ({
            id: b.id,
            marca: b.marca,
            material: b.material,
            color: b.color_nombre,
            hex: b.color_hex,
            peso_total_g: b.peso_inicial_g,
            peso_actual_g: b.peso_actual_g,
            costo_compra: b.costo_kg,
          }));
          setSpools(dbSpools);
        }

        // 2. Cargar Finanzas y Activos
        const resFinanzas = await fetch("/api/finanzas");
        const jsonFinanzas = await resFinanzas.json();
        if (jsonFinanzas.success) {
          if (jsonFinanzas.data.activos?.length > 0) {
            setInversiones(
              jsonFinanzas.data.activos.map((a: any) => ({
                id: a.id,
                nombre: a.nombre,
                costo: a.costo,
                categoria: a.categoria?.toLowerCase() || "herramientas",
                fecha: a.fecha ? a.fecha.split("T")[0] : "2026-09-14",
              }))
            );
          }
          if (jsonFinanzas.data.config) {
            setConfig({
              id: jsonFinanzas.data.config.id,
              costo_kwh: jsonFinanzas.data.config.costo_kwh,
              costo_hora_operador: jsonFinanzas.data.config.costo_hora_operador,
              margen_ganancia_default: jsonFinanzas.data.config.margen_ganancia_default,
            });
          }
        }

        // 3. Cargar Trabajos
        const resTrabajos = await fetch("/api/trabajos");
        const jsonTrabajos = await resTrabajos.json();
        if (jsonTrabajos.success && jsonTrabajos.data?.length > 0) {
          const dbTrabajos: Trabajo[] = jsonTrabajos.data.map((t: any) => {
            let printerId = 1;
            if (t.impresora_asignada?.includes("X1")) printerId = 2;
            else if (t.impresora_asignada?.includes("A1")) printerId = 3;

            let estado: "ejecucion" | "espera" | "completado" = "espera";
            if (t.estado === "EN_PROCESO") estado = "ejecucion";
            else if (t.estado === "COMPLETADO") estado = "completado";

            return {
              id: t.id,
              codigo: t.codigo_orden,
              nombre: t.nombre_archivo,
              cliente: t.cliente,
              impresoraId: printerId,
              bobinaId: 1,
              pesoGramos: t.gramos_filamento,
              tiempoMinutos: t.tiempo_minutos,
              tiempoTranscurridoMin: Math.round((t.tiempo_minutos * (t.progreso_porcentaje || 0)) / 100),
              estado,
              costoFilamento: t.costo_filamento,
              costoElectricidad: t.costo_energia,
              costoAmortizacion: t.costo_amortizacion,
              costoManoObra: t.costo_operador,
              costoTotal: t.costo_total,
              precioVenta: t.precio_venta,
              gananciaNeta: t.ganancia_neta,
              fecha: t.fecha_creacion ? t.fecha_creacion.split("T")[0] : "2026-09-14",
              prioridad: (t.prioridad || "media").toLowerCase() as "alta" | "media" | "baja",
            };
          });
          setTrabajos(dbTrabajos);
        }
      } catch (err) {
        console.warn("Conexión con Supabase no disponible en este cliente, usando caché local.", err);
      } finally {
        setIsSyncing(false);
      }
    }

    loadDataFromSupabase();
  }, []);

  // Form parameters in Cotizador
  const [selectedPrinterId, setSelectedPrinterId] = useState<number>(1);
  const [selectedSpoolId, setSelectedSpoolId] = useState<number>(1);
  const [grams, setGrams] = useState<number>(120);
  const [printTimeMin, setPrintTimeMin] = useState<number>(180);
  const [operatorTimeMin, setOperatorTimeMin] = useState<number>(15);
  const [marginPercent, setMarginPercent] = useState<number>(150);

  // Modals state
  const [modalTrabajoOpen, setModalTrabajoOpen] = useState(false);
  const [modalInversionOpen, setModalInversionOpen] = useState(false);

  // New Job Form State
  const [newJobName, setNewJobName] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [newJobPrinterId, setNewJobPrinterId] = useState(1);
  const [newJobSpoolId, setNewJobSpoolId] = useState(1);
  const [newJobGrams, setNewJobGrams] = useState(95);
  const [newJobTimeMin, setNewJobTimeMin] = useState(140);
  const [newJobMargin, setNewJobMargin] = useState(150);
  const [newJobPriority, setNewJobPriority] = useState<"alta" | "media" | "baja">("media");

  // New Asset Form State
  const [newAssetCategory, setNewAssetCategory] = useState<"maquinaria" | "herramientas" | "insumos">("herramientas");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetCost, setNewAssetCost] = useState(250);

  // Real Slicer parsing state
  const [fileName, setFileName] = useState<string>("Bambu_Organizador_Modular_v2.3mf");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sliceData, setSliceData] = useState<BambuSliceMetadata | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current selected entities
  const currentPrinter = useMemo(
    () => printers.find((p) => p.id === selectedPrinterId) || printers[0],
    [printers, selectedPrinterId]
  );
  const currentSpool = useMemo(
    () => spools.find((s) => s.id === selectedSpoolId) || spools[0],
    [spools, selectedSpoolId]
  );

  // Slicer processor
  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".3mf")) {
      setParseError("El archivo seleccionado no tiene la extensión .3mf");
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

      setToastMessage(
        `✓ Archivo procesado: ${metadata.fileName} (${metadata.totalWeightGrams}g, ${metadata.printTimeMinutes} min)`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Error al procesar archivo .3mf:", err);
      setParseError(err.message || "Error al procesar el archivo .3mf");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  // Calculations for current cotizador
  const calculations = useMemo(() => {
    const spoolCostPerGram = currentSpool.costo_compra / currentSpool.peso_total_g;
    const costFilament = grams * spoolCostPerGram;
    const printHours = printTimeMin / 60.0;
    const operatorHours = operatorTimeMin / 60.0;
    const costElectricity = currentPrinter.consumo_kw * printHours * config.costo_kwh;
    const hourlyAmortization = currentPrinter.costo_maquina / currentPrinter.horas_vida_util;
    const costMachine = hourlyAmortization * printHours;
    const costLabor = operatorHours * config.costo_hora_operador;
    const totalCost = costFilament + costElectricity + costMachine + costLabor;
    const suggestedPrice = totalCost * (1 + marginPercent / 100.0);
    const netProfit = suggestedPrice - totalCost;
    const profitMarginOnSale = suggestedPrice > 0 ? (netProfit / suggestedPrice) * 100 : 0;
    const hasSufficientStock = currentSpool.peso_actual_g >= grams;
    const stockDifference = currentSpool.peso_actual_g - grams;

    return {
      spoolCostPerGram,
      costFilament,
      costElectricity,
      costMachine,
      hourlyAmortization,
      costLabor,
      totalCost,
      suggestedPrice,
      netProfit,
      profitMarginOnSale,
      hasSufficientStock,
      stockDifference,
      printHours,
      operatorHours,
    };
  }, [currentPrinter, currentSpool, grams, printTimeMin, operatorTimeMin, config, marginPercent]);

  // Inventory Totals
  const inventoryStats = useMemo(() => {
    const totalWeight = spools.reduce((acc, s) => acc + s.peso_actual_g, 0);
    const totalCapital = spools.reduce((acc, s) => acc + s.peso_actual_g * (s.costo_compra / s.peso_total_g), 0);
    const lowStockCount = spools.filter((s) => (s.peso_actual_g / s.peso_total_g) * 100 < 20).length;
    return { totalWeight, totalCapital, lowStockCount };
  }, [spools]);

  // Filtered jobs by period
  const filteredTrabajos = useMemo(() => {
    if (periodoFiltro === "general") return trabajos;
    if (periodoFiltro === "semana") {
      return trabajos.filter((t) => t.fecha >= "2026-09-08" && t.fecha <= "2026-09-14");
    }
    if (periodoFiltro === "mes") {
      return trabajos.filter((t) => t.fecha.startsWith("2026-09"));
    }
    return trabajos;
  }, [trabajos, periodoFiltro]);

  const jobsEnEjecucion = useMemo(() => trabajos.filter((t) => t.estado === "ejecucion"), [trabajos]);
  const jobsEnEspera = useMemo(() => trabajos.filter((t) => t.estado === "espera"), [trabajos]);
  const jobsCompletados = useMemo(() => filteredTrabajos.filter((t) => t.estado === "completado"), [filteredTrabajos]);

  // Financial calculations
  const financeMetrics = useMemo(() => {
    const totalInversion = inversiones.reduce((acc, i) => acc + i.costo, 0);
    const allCompleted = trabajos.filter((t) => t.estado === "completado");
    const totalHistoricProfit = allCompleted.reduce((acc, t) => acc + t.gananciaNeta, 0);
    const roiPercent = totalInversion > 0 ? (totalHistoricProfit / totalInversion) * 100 : 0;

    const periodRevenue = jobsCompletados.reduce((acc, t) => acc + t.precioVenta, 0);
    const periodCost = jobsCompletados.reduce((acc, t) => acc + t.costoTotal, 0);
    const periodNet = periodRevenue - periodCost;
    const periodMargin = periodRevenue > 0 ? (periodNet / periodRevenue) * 100 : 0;

    const costFilament = jobsCompletados.reduce((acc, t) => acc + t.costoFilamento, 0);
    const costElec = jobsCompletados.reduce((acc, t) => acc + t.costoElectricidad, 0);
    const costMach = jobsCompletados.reduce((acc, t) => acc + t.costoAmortizacion, 0);
    const costLabor = jobsCompletados.reduce((acc, t) => acc + t.costoManoObra, 0);

    return {
      totalInversion,
      totalHistoricProfit,
      roiPercent,
      periodRevenue,
      periodCost,
      periodNet,
      periodMargin,
      costFilament,
      costElec,
      costMach,
      costLabor,
    };
  }, [inversiones, trabajos, jobsCompletados]);

  // Chart data calculation
  const chartData = useMemo(() => {
    let fechas: string[] = [];
    if (periodoFiltro === "semana") {
      fechas = ["2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14"];
    } else if (periodoFiltro === "mes") {
      fechas = Array.from(new Set(trabajos.filter((t) => t.fecha.startsWith("2026-09")).map((t) => t.fecha))).sort();
    } else {
      fechas = Array.from(new Set(trabajos.map((t) => t.fecha))).sort();
    }

    let cumRev = 0;
    let cumCost = 0;
    let cumNet = 0;

    const points = fechas.map((f) => {
      const parts = f.split("-");
      const label = f === "2026-09-14" ? `${parts[2]}/${parts[1]} (Hoy)` : `${parts[2]}/${parts[1]}`;
      const dayJobs = trabajos.filter((t) => t.fecha === f && t.estado === "completado");
      const dayRev = dayJobs.reduce((acc, t) => acc + t.precioVenta, 0);
      const dayCost = dayJobs.reduce((acc, t) => acc + t.costoTotal, 0);
      const dayNet = dayRev - dayCost;

      cumRev += dayRev;
      cumCost += dayCost;
      cumNet += dayNet;

      return {
        fecha: f,
        label,
        rev: chartMode === "cumulative" ? cumRev : dayRev,
        cost: chartMode === "cumulative" ? cumCost : dayCost,
        net: chartMode === "cumulative" ? cumNet : dayNet,
      };
    });

    const maxVal = Math.max(10, ...points.map((p) => Math.max(p.rev, p.cost, p.net)));
    return { points, maxVal };
  }, [trabajos, periodoFiltro, chartMode]);

  // Job Actions
  const handleIniciarTrabajo = (jobId: number) => {
    const job = trabajos.find((t) => t.id === jobId);
    if (!job) return;

    let targetPrinter = printers.find(
      (p) => p.id === job.impresoraId && !trabajos.some((t) => t.impresoraId === p.id && t.estado === "ejecucion")
    );
    if (!targetPrinter) {
      targetPrinter = printers.find((p) => !trabajos.some((t) => t.impresoraId === p.id && t.estado === "ejecucion"));
    }

    if (!targetPrinter) {
      alert("⚠️ Todas las impresoras están ocupadas en ejecución.");
      return;
    }

    setTrabajos((prev) =>
      prev.map((t) => (t.id === jobId ? { ...t, estado: "ejecucion", impresoraId: targetPrinter!.id, tiempoTranscurridoMin: 0 } : t))
    );
    setToastMessage(`🚀 ¡Trabajo "${job.nombre}" iniciado en ${targetPrinter.nombre}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCompletarTrabajo = (jobId: number) => {
    const job = trabajos.find((t) => t.id === jobId);
    if (!job) return;

    setTrabajos((prev) =>
      prev.map((t) =>
        t.id === jobId ? { ...t, estado: "completado", tiempoTranscurridoMin: t.tiempoMinutos, fecha: "2026-09-14" } : t
      )
    );
    setToastMessage(`✅ ¡Trabajo "${job.nombre}" completado! Ganancia sumada: +$${job.gananciaNeta.toFixed(2)}`);
    setTimeout(() => setToastMessage(null), 4000);

    // Persistir en Supabase
    fetch("/api/trabajos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: jobId,
        estado: "COMPLETADO",
        progreso_porcentaje: 100,
        fecha_completado: new Date().toISOString(),
      }),
    }).catch((err) => console.warn("Error persistiendo completado en Supabase:", err));
  };

  const handleCancelarTrabajo = (jobId: number) => {
    const job = trabajos.find((t) => t.id === jobId);
    if (!job) return;
    if (confirm(`¿Cancelar el trabajo "${job.nombre}"?`)) {
      setTrabajos((prev) => prev.filter((t) => t.id !== jobId));
      fetch(`/api/trabajos?id=${jobId}`, { method: "DELETE" }).catch((err) =>
        console.warn("Error eliminando trabajo en Supabase:", err)
      );
    }
  };

  // Confirm order from Cotizador
  const handleConfirmOrder = () => {
    if (!calculations.hasSufficientStock) {
      alert(`❌ Stock insuficiente: faltan ${Math.abs(calculations.stockDifference)}g.`);
      return;
    }

    // Deduct stock
    setSpools((prev) =>
      prev.map((s) => (s.id === selectedSpoolId ? { ...s, peso_actual_g: s.peso_actual_g - grams } : s))
    );

    // Create job
    const newJob: Trabajo = {
      id: Date.now(),
      codigo: `TRB-${String(trabajos.length + 1).padStart(3, "0")}`,
      nombre: fileName,
      cliente: "Cliente BambuFarm OS",
      impresoraId: selectedPrinterId,
      bobinaId: selectedSpoolId,
      pesoGramos: grams,
      tiempoMinutos: printTimeMin,
      tiempoTranscurridoMin: 0,
      estado: "espera",
      costoFilamento: calculations.costFilament,
      costoElectricidad: calculations.costElectricity,
      costoAmortizacion: calculations.costMachine,
      costoManoObra: calculations.costLabor,
      costoTotal: calculations.totalCost,
      precioVenta: calculations.suggestedPrice,
      gananciaNeta: calculations.netProfit,
      fecha: "2026-09-14",
      prioridad: "alta",
    };

    setTrabajos((prev) => [newJob, ...prev]);
    setToastMessage(`✓ ¡Pedido registrado! Agregado a la Lista de Espera.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Persistir trabajo en Supabase
    fetch("/api/trabajos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_orden: newJob.codigo,
        nombre_archivo: newJob.nombre,
        cliente: newJob.cliente,
        impresora_asignada: currentPrinter.nombre,
        material: currentSpool.material,
        color: currentSpool.color,
        color_hex: currentSpool.hex,
        estado: "EN_ESPERA",
        prioridad: "ALTA",
        tiempo_minutos: newJob.tiempoMinutos,
        gramos_filamento: newJob.pesoGramos,
        costo_energia: newJob.costoElectricidad,
        costo_operador: newJob.costoManoObra,
        costo_filamento: newJob.costoFilamento,
        costo_amortizacion: newJob.costoAmortizacion,
        costo_total: newJob.costoTotal,
        precio_venta: newJob.precioVenta,
        gananciaNeta: newJob.gananciaNeta,
        margen_porcentaje: marginPercent,
      }),
    }).catch((err) => console.warn("Error guardando orden en Supabase:", err));

    // Descontar stock en Supabase
    const updatedSpool = spools.find((s) => s.id === selectedSpoolId);
    if (updatedSpool) {
      fetch("/api/filamentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSpoolId,
          peso_actual_g: Math.max(0, updatedSpool.peso_actual_g - grams),
        }),
      }).catch((err) => console.warn("Error descontando bobina en Supabase:", err));
    }
  };

  const handleGuardarNuevoTrabajo = (e: React.FormEvent) => {
    e.preventDefault();
    const spool = spools.find((s) => s.id === newJobSpoolId) || spools[0];
    const printer = printers.find((p) => p.id === newJobPrinterId) || printers[0];

    const costFilament = newJobGrams * (spool.costo_compra / spool.peso_total_g);
    const costElec = printer.consumo_kw * (newJobTimeMin / 60) * config.costo_kwh;
    const costMach = (printer.costo_maquina / printer.horas_vida_util) * (newJobTimeMin / 60);
    const costLabor = 0.25 * config.costo_hora_operador;
    const totalCost = costFilament + costElec + costMach + costLabor;
    const suggestedPrice = totalCost * (1 + newJobMargin / 100);
    const netProfit = suggestedPrice - totalCost;

    const newJob: Trabajo = {
      id: Date.now(),
      codigo: `TRB-${String(trabajos.length + 1).padStart(3, "0")}`,
      nombre: newJobName.endsWith(".3mf") ? newJobName : `${newJobName}.3mf`,
      cliente: newJobClient,
      impresoraId: newJobPrinterId,
      bobinaId: newJobSpoolId,
      pesoGramos: newJobGrams,
      tiempoMinutos: newJobTimeMin,
      tiempoTranscurridoMin: 0,
      estado: "espera",
      costoFilamento: costFilament,
      costoElectricidad: costElec,
      costoAmortizacion: costMach,
      costoManoObra: costLabor,
      costoTotal: totalCost,
      precioVenta: suggestedPrice,
      gananciaNeta: netProfit,
      fecha: "2026-09-14",
      prioridad: newJobPriority,
    };

    setTrabajos((prev) => [newJob, ...prev]);
    setModalTrabajoOpen(false);
    setNewJobName("");
    setNewJobClient("");
    setToastMessage(`✓ Trabajo "${newJob.nombre}" agregado a la cola.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Persistir nuevo trabajo en Supabase
    fetch("/api/trabajos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_orden: newJob.codigo,
        nombre_archivo: newJob.nombre,
        cliente: newJob.cliente,
        impresora_asignada: printer.nombre,
        material: spool.material,
        color: spool.color,
        color_hex: spool.hex,
        estado: "EN_ESPERA",
        prioridad: newJobPriority.toUpperCase(),
        tiempo_minutos: newJob.tiempoMinutos,
        gramos_filamento: newJob.pesoGramos,
        costo_energia: costElec,
        costo_operador: costLabor,
        costo_filamento: costFilament,
        costo_amortizacion: costMach,
        costo_total: totalCost,
        precio_venta: suggestedPrice,
        ganancia_neta: netProfit,
        margen_porcentaje: newJobMargin,
      }),
    }).catch((err) => console.warn("Error guardando trabajo en Supabase:", err));
  };

  const handleGuardarNuevoActivo = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ActivoInversion = {
      id: Date.now(),
      nombre: newAssetName,
      costo: newAssetCost,
      categoria: newAssetCategory,
      fecha: "2026-09-14",
    };
    setInversiones((prev) => [...prev, item]);
    setModalInversionOpen(false);
    setNewAssetName("");
    setToastMessage(`✓ Activo "${item.nombre}" ($${item.costo.toFixed(2)}) sumado a la inversión inicial.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Persistir en Supabase
    fetch("/api/finanzas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newAssetName,
        categoria: newAssetCategory,
        costo: newAssetCost,
      }),
    }).catch((err) => console.warn("Error guardando activo en Supabase:", err));
  };

  const handleResetData = () => {
    setSpools(INITIAL_SPOOLS);
    setTrabajos(INITIAL_TRABAJOS);
    setInversiones(INITIAL_INVERSION);
    setConfig(INITIAL_CONFIG);
    setPeriodoFiltro("semana");
    setChartMode("daily");
    setGrams(120);
    setPrintTimeMin(180);
    setMarginPercent(150);
    setSliceData(null);
    setParseError(null);
    setToastMessage("✓ Datos mock restablecidos.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950">
      <input ref={fileInputRef} type="file" accept=".3mf" onChange={handleFileInputChange} className="hidden" />

      {/* HEADER */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-zinc-950">
              <Layers className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">
                  BambuFarm<span className="text-emerald-500">.OS</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isSyncing ? "Sincronizando..." : "Supabase Cloud DB"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">MendoDeco • Control de Flota, Finanzas & Cotizador Bambu Studio</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setModalTrabajoOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Cargar Trabajo</span>
            </button>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST / ALERTS */}
      {toastMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {parseError && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-400 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{parseError}</span>
        </div>
      )}

      {/* MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
          <div className="flex flex-wrap gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 w-fit">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "jobs"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>1. Trabajos & Flota</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                {jobsEnEjecucion.length} en curso
              </span>
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "finance"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>2. Finanzas & Gráfico Diario</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-emerald-400 font-mono font-semibold">
                ROI {financeMetrics.roiPercent.toFixed(0)}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "calculator"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>3. Cotizador (.3MF Bambu)</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "inventory"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>4. Inventario & Stock</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-300 font-mono">
                {spools.length}
              </span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: TRABAJOS & FLOTA (EN EJECUCIÓN / EN ESPERA)                */}
        {/* ================================================================= */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* Period Selector Banner */}
            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Control de Flota y Trabajos de Producción</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                      {periodoFiltro === "semana" ? "Esta Semana" : periodoFiltro === "mes" ? "Este Mes" : "General"}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Producciones del período: {filteredTrabajos.length} trabajos ({jobsEnEjecucion.length} en ejecución, {jobsEnEspera.length} en espera, {jobsCompletados.length} terminados) &bull; Facturación:{" "}
                    <strong className="text-white font-mono">${financeMetrics.periodRevenue.toFixed(2)}</strong> &bull; Ganancia:{" "}
                    <strong className="text-emerald-400 font-mono">+${financeMetrics.periodNet.toFixed(2)}</strong>
                  </p>
                </div>
              </div>

              {/* Period Buttons */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setPeriodoFiltro("general")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "general" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setPeriodoFiltro("semana")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "semana" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setPeriodoFiltro("mes")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "mes" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>En Ejecución (Imprimiendo)</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{jobsEnEjecucion.length}</span>
                  <span className="text-xs text-emerald-400 font-medium">de {printers.length} impresoras</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">Flota Bambu activa</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>En Lista de Espera</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">{jobsEnEspera.length}</span>
                  <span className="text-xs text-zinc-400 font-mono">pedidos en cola</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {Math.floor(jobsEnEspera.reduce((acc, t) => acc + t.tiempoMinutos, 0) / 60)}h estimadas
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Completados en Período</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono">{jobsCompletados.length}</span>
                  <span className="text-xs text-zinc-400">piezas terminadas</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {jobsCompletados.reduce((acc, t) => acc + t.pesoGramos, 0)}g transformados
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Producción Facturada</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">${financeMetrics.periodRevenue.toFixed(2)}</span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">+${financeMetrics.periodNet.toFixed(2)} neto</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">Margen: {financeMetrics.periodMargin.toFixed(1)}%</div>
              </div>
            </div>

            {/* LIVE PRINTERS GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Flota en Ejecución (Trabajos en Máquina)</span>
                </h3>
                <button
                  onClick={() => setModalTrabajoOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nuevo Trabajo Rápido</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {printers.map((printer) => {
                  const activeJob = trabajos.find((t) => t.impresoraId === printer.id && t.estado === "ejecucion");
                  if (activeJob) {
                    const spool = spools.find((b) => b.id === activeJob.bobinaId) || spools[0];
                    const percent = Math.min(100, Math.round((activeJob.tiempoTranscurridoMin / activeJob.tiempoMinutos) * 100));
                    const remMin = Math.max(0, activeJob.tiempoMinutos - activeJob.tiempoTranscurridoMin);
                    const remH = Math.floor(remMin / 60);
                    const remM = remMin % 60;
                    const remStr = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`;

                    return (
                      <div
                        key={printer.id}
                        className="bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                IMPRIMIENDO ({percent}%)
                              </span>
                              <h4 className="text-sm font-bold text-white mt-0.5">{printer.nombre}</h4>
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700">
                              {printer.consumo_kw} kW
                            </span>
                          </div>

                          <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800 space-y-1">
                            <div className="text-xs font-bold text-white truncate" title={activeJob.nombre}>
                              {activeJob.nombre}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>
                                Cliente: <strong className="text-zinc-200">{activeJob.cliente}</strong>
                              </span>
                              <span className="font-mono">{activeJob.pesoGramos}g</span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400 border-t border-zinc-800/80 mt-1">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: spool.hex }} />
                              <span className="text-zinc-300 font-medium">
                                {spool.marca} {spool.material}
                              </span>
                              <span className="text-zinc-500 font-mono">({spool.color})</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-zinc-400">Progreso:</span>
                              <span className="font-bold text-emerald-400">
                                {percent}% &bull; resta ~{remStr}
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                              <span>
                                {activeJob.tiempoTranscurridoMin}m / {activeJob.tiempoMinutos}m
                              </span>
                              <span>
                                Costo: ${activeJob.costoTotal.toFixed(2)} | Venta: ${activeJob.precioVenta.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                          <button
                            onClick={() => handleCompletarTrabajo(activeJob.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Completar</span>
                          </button>
                          <button
                            onClick={() => handleCancelarTrabajo(activeJob.id)}
                            className="p-2 bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 rounded-xl text-xs transition"
                            title="Cancelar trabajo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={printer.id}
                      className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block"></span>
                              DISPONIBLE / STANDBY
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{printer.nombre}</h4>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded-md">
                            {printer.consumo_kw} kW
                          </span>
                        </div>

                        <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-800/60 text-center space-y-1.5 py-6">
                          <CheckCircle className="w-7 h-7 text-zinc-600 mx-auto" />
                          <div className="text-xs font-semibold text-zinc-300">Cama limpia y calibrada</div>
                          <div className="text-[11px] text-zinc-500">Lista para procesar trabajos de la cola</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => {
                            const next = jobsEnEspera[0];
                            if (next) handleIniciarTrabajo(next.id);
                            else alert("No hay trabajos en espera.");
                          }}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Asignar Trabajo de Cola</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WAITING QUEUE TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Trabajos en Lista de Espera (Cola de Producción)</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    {jobsEnEspera.length} pendientes
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab("calculator")}
                  className="text-xs text-zinc-400 hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>Cotizar nuevo .3MF para la cola</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/70 text-zinc-400 font-mono uppercase text-[11px] border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Cód / Prioridad</th>
                        <th className="p-3.5">Pieza / Archivo</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Material Requerido</th>
                        <th className="p-3.5">Peso & Tiempo</th>
                        <th className="p-3.5">Costo Prod.</th>
                        <th className="p-3.5">Precio Venta</th>
                        <th className="p-3.5 text-emerald-400">Ganancia Est.</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {jobsEnEspera.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-zinc-500">
                            <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                            No hay trabajos pendientes en cola. ¡Usa el cotizador para agregar!
                          </td>
                        </tr>
                      ) : (
                        jobsEnEspera.map((job) => {
                          const spool = spools.find((b) => b.id === job.bobinaId) || spools[0];
                          const printer = printers.find((p) => p.id === job.impresoraId) || printers[0];
                          const hasStock = spool.peso_actual_g >= job.pesoGramos;

                          return (
                            <tr key={job.id} className="hover:bg-zinc-800/40 transition">
                              <td className="p-3.5">
                                <div className="font-mono font-bold text-white text-[11px]">{job.codigo}</div>
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded border ${
                                    job.prioridad === "alta"
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {job.prioridad}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-white max-w-xs truncate" title={job.nombre}>
                                  {job.nombre}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Impresora: <span className="font-mono text-zinc-300">{printer.nombre.split(" ")[2] || printer.nombre}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-zinc-300">{job.cliente}</td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: spool.hex }} />
                                  <span className="text-zinc-200">
                                    {spool.marca} {spool.material}
                                  </span>
                                </div>
                                <div className={`text-[10px] mt-0.5 ${hasStock ? "text-emerald-400" : "text-rose-400 font-semibold"}`}>
                                  {hasStock ? `Stock OK (${spool.peso_actual_g}g disp)` : `¡Faltan ${job.pesoGramos - spool.peso_actual_g}g!`}
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-zinc-300">
                                <div>{job.pesoGramos}g</div>
                                <div className="text-[10px] text-zinc-500">
                                  {Math.floor(job.tiempoMinutos / 60)}h {job.tiempoMinutos % 60}m
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-rose-300 font-bold">${job.costoTotal.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-zinc-100 font-bold">${job.precioVenta.toFixed(2)}</td>
                              <td className="p-3.5 font-mono text-emerald-400 font-bold">+${job.gananciaNeta.toFixed(2)}</td>
                              <td className="p-3.5 text-right space-x-1">
                                <button
                                  onClick={() => handleIniciarTrabajo(job.id)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition inline-flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Imprimir</span>
                                </button>
                                <button
                                  onClick={() => handleCancelarTrabajo(job.id)}
                                  className="p-1 text-zinc-500 hover:text-rose-400 transition"
                                  title="Eliminar de cola"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COMPLETED HISTORY TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Historial de Trabajos en el Período</span>
                </h3>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950/70 text-zinc-400 uppercase text-[11px] border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5">Pieza</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Máquina / Material</th>
                        <th className="p-3.5">Gramos & Tiempo</th>
                        <th className="p-3.5 text-rose-300">Costo Total</th>
                        <th className="p-3.5 text-zinc-200">Precio Cobrado</th>
                        <th className="p-3.5 text-emerald-400 font-bold">Ganancia Neta (Resta)</th>
                        <th className="p-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {jobsCompletados.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-zinc-500 font-sans">
                            No hay trabajos completados en este período.
                          </td>
                        </tr>
                      ) : (
                        jobsCompletados.map((job) => {
                          const spool = spools.find((b) => b.id === job.bobinaId) || spools[0];
                          const printer = printers.find((p) => p.id === job.impresoraId) || printers[0];

                          return (
                            <tr key={job.id} className="hover:bg-zinc-800/40 transition">
                              <td className="p-3.5 text-zinc-400">{job.fecha}</td>
                              <td className="p-3.5 font-sans font-bold text-white max-w-xs truncate">{job.nombre}</td>
                              <td className="p-3.5 font-sans text-zinc-300">{job.cliente}</td>
                              <td className="p-3.5 font-sans text-zinc-300">
                                <div>{printer.nombre.split(" ")[2] || printer.nombre}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  {spool.marca} {spool.material}
                                </div>
                              </td>
                              <td className="p-3.5 text-zinc-300">
                                {job.pesoGramos}g &bull; {Math.floor(job.tiempoMinutos / 60)}h {job.tiempoMinutos % 60}m
                              </td>
                              <td className="p-3.5 text-rose-300 font-bold">${job.costoTotal.toFixed(2)}</td>
                              <td className="p-3.5 text-zinc-100 font-bold">${job.precioVenta.toFixed(2)}</td>
                              <td className="p-3.5 text-emerald-400 font-bold">+${job.gananciaNeta.toFixed(2)}</td>
                              <td className="p-3.5 text-center font-sans">
                                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ✓ Listo
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: BALANCE ECONÓMICO & FINANZAS                               */}
        {/* ================================================================= */}
        {activeTab === "finance" && (
          <div className="space-y-8">
            {/* Top Period Controls */}
            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Balance Económico, Rentabilidad & Cuentas</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
                      {periodoFiltro === "semana" ? "Esta Semana" : periodoFiltro === "mes" ? "Este Mes" : "General"}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Control de inversiones iniciales, costos desglosados y resultado neto (&quot;la resta&quot;).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setPeriodoFiltro("general")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "general" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setPeriodoFiltro("semana")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "semana" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setPeriodoFiltro("mes")}
                  className={`px-3 py-1.5 rounded-lg transition font-medium ${
                    periodoFiltro === "mes" ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* INVERSIÓN INICIAL & ACTIVOS DE LA GRANJA */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      CAPEX / Activos
                    </span>
                    <h3 className="text-lg font-extrabold text-white">Inversión Inicial & Equipamiento de Granja</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Capital invertido en impresoras Bambu Lab, repuestos, herramientas y stock de filamento base.
                  </p>
                </div>
                <button
                  onClick={() => setModalInversionOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Agregar Activo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Flota de Impresoras (3)</span>
                    <Printer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">
                    $
                    {inversiones
                      .filter((i) => i.categoria === "maquinaria")
                      .reduce((acc, i) => acc + i.costo, 0)
                      .toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 space-y-0.5 font-mono">
                    <div>• P1S + AMS: $950</div>
                    <div>• X1-C + AMS: $1,500</div>
                    <div>• A1 Mini: $400</div>
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Herramientas & Setup</span>
                    <Wrench className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">
                    $
                    {inversiones
                      .filter((i) => i.categoria === "herramientas")
                      .reduce((acc, i) => acc + i.costo, 0)
                      .toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 space-y-0.5 font-mono">
                    <div>• 3 Placas PEI texturadas: $90</div>
                    <div>• Boquillas endurecidas: $45</div>
                    <div>• Secador Sunlu S2: $65</div>
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Stock Inicial Filamentos</span>
                    <Disc className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">
                    $
                    {inversiones
                      .filter((i) => i.categoria === "insumos")
                      .reduce((acc, i) => acc + i.costo, 0)
                      .toFixed(2)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 space-y-0.5 font-mono">
                    <div>• 4 bobinas 1kg base ($96)</div>
                    <div>• Stock actual valorizado: ${inventoryStats.totalCapital.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                      <span>INVERSIÓN TOTAL INICIAL</span>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="mt-2 text-2xl font-black font-mono text-white">
                      ${financeMetrics.totalInversion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Recupero (ROI):</span>
                      <span className="font-bold text-emerald-400">{financeMetrics.roiPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full mt-1.5 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, financeMetrics.roiPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                      <span>Ganancia Neta: ${financeMetrics.totalHistoricProfit.toFixed(2)}</span>
                      <span>Objetivo: ${financeMetrics.totalInversion.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Ingresos Totales (Ventas)</span>
                  <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">${financeMetrics.periodRevenue.toFixed(2)}</span>
                  <span className="text-xs text-zinc-400">en {jobsCompletados.length} trabajos</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">Cobrado o presupuestado</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Costos de Producción</span>
                  <Coins className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-400 font-mono">${financeMetrics.periodCost.toFixed(2)}</span>
                  <span className="text-xs text-zinc-400">gasto directo</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">Filamento + Luz + Amortiz + Mano de Obra</div>
              </div>

              <div className="bg-zinc-900/60 border border-emerald-500/40 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span>Ganancia Neta (&quot;La Resta&quot;)</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 font-mono">+${financeMetrics.periodNet.toFixed(2)}</span>
                  <span className="text-xs text-emerald-300 font-semibold font-mono">{financeMetrics.periodMargin.toFixed(1)}% s/ venta</span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">Utilidad real en mano</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Composición del Costo</span>
                  <PieChart className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Filamento:</span>
                    <span className="text-zinc-200 font-bold">${financeMetrics.costFilament.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Electricidad:</span>
                    <span className="text-zinc-200 font-bold">${financeMetrics.costElec.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Amortiz. Máquinas:</span>
                    <span className="text-zinc-200 font-bold">${financeMetrics.costMach.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Mano de Obra:</span>
                    <span className="text-zinc-200 font-bold">${financeMetrics.costLabor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE DAY-BY-DAY CHART */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-emerald-400" />
                    <span>Evolución Económica Día a Día (Ingresos, Costos y Ganancia Neta)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Visualización dinámica que se actualiza día a día con cada trabajo completado.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                      onClick={() => setChartMode("daily")}
                      className={`px-3 py-1 rounded-lg transition ${
                        chartMode === "daily" ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Valores Diarios
                    </button>
                    <button
                      onClick={() => setChartMode("cumulative")}
                      className={`px-3 py-1 rounded-lg transition ${
                        chartMode === "cumulative" ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Acumulado Continuo
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend Tags */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-zinc-300">Ingresos / Ventas ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-zinc-300">Costos de Producción ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block ring-2 ring-emerald-500/20"></span>
                  <span className="text-white font-bold">Ganancia Neta (&quot;La Resta&quot;) ($)</span>
                </div>
              </div>

              {/* SVG High-Fidelity Chart */}
              <div className="relative w-full h-72 sm:h-80 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/60 flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 240" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ae42" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00ae42" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 200 - ratio * 180;
                    const val = (ratio * chartData.maxVal).toFixed(0);
                    return (
                      <g key={idx}>
                        <line x1="40" y1={y} x2="690" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <text x="35" y={y + 4} fill="#71717a" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
                          ${val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Lines & Points */}
                  {chartData.points.length > 1 && (
                    <>
                      {/* Profit Area */}
                      <path
                        d={`M ${40 + 0 * (650 / (chartData.points.length - 1))} 200 ` +
                          chartData.points
                            .map((p, i) => {
                              const x = 40 + i * (650 / (chartData.points.length - 1));
                              const y = 200 - (p.net / chartData.maxVal) * 180;
                              return `L ${x} ${y}`;
                            })
                            .join(" ") +
                          ` L ${40 + (chartData.points.length - 1) * (650 / (chartData.points.length - 1))} 200 Z`}
                        fill="url(#profitAreaGrad)"
                      />

                      {/* Revenue Line (Emerald) */}
                      <path
                        d={chartData.points
                          .map((p, i) => {
                            const x = 40 + i * (650 / (chartData.points.length - 1));
                            const y = 200 - (p.rev / chartData.maxVal) * 180;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />

                      {/* Cost Line (Rose) */}
                      <path
                        d={chartData.points
                          .map((p, i) => {
                            const x = 40 + i * (650 / (chartData.points.length - 1));
                            const y = 200 - (p.cost / chartData.maxVal) * 180;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                      />

                      {/* Net Profit Line (Bambu Green bold) */}
                      <path
                        d={chartData.points
                          .map((p, i) => {
                            const x = 40 + i * (650 / (chartData.points.length - 1));
                            const y = 200 - (p.net / chartData.maxVal) * 180;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#00ae42"
                        strokeWidth="3.5"
                      />

                      {/* Dots & Tooltips */}
                      {chartData.points.map((p, i) => {
                        const x = 40 + i * (650 / (chartData.points.length - 1));
                        const yNet = 200 - (p.net / chartData.maxVal) * 180;
                        const yRev = 200 - (p.rev / chartData.maxVal) * 180;
                        const yCost = 200 - (p.cost / chartData.maxVal) * 180;

                        return (
                          <g key={i} className="group">
                            <circle cx={x} cy={yRev} r="3.5" fill="#10b981" />
                            <circle cx={x} cy={yCost} r="3.5" fill="#f43f5e" />
                            <circle cx={x} cy={yNet} r="5" fill="#00ae42" stroke="#09090b" strokeWidth="2" />

                            {/* X-axis label */}
                            <text x={x} y="225" fill="#a1a1aa" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                              {p.label}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* DETAIL TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Detalle Económico por Trabajo (Cuentas Unitarias & Ganancia Neta)</span>
                </h3>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-950/70 text-zinc-400 uppercase text-[11px] border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5">Trabajo / Pieza</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Costo Filamento</th>
                        <th className="p-3.5">Luz + Amort + Mano Obra</th>
                        <th className="p-3.5 text-rose-400 font-bold">Costo Total</th>
                        <th className="p-3.5 text-zinc-200 font-bold">Precio Cobrado</th>
                        <th className="p-3.5 text-emerald-400 font-bold">Ganancia Neta (Resta)</th>
                        <th className="p-3.5 text-center">Rentabilidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {jobsCompletados.map((job) => {
                        const otherCosts = job.costoElectricidad + job.costoAmortizacion + job.costoManoObra;
                        const margin = job.precioVenta > 0 ? ((job.gananciaNeta / job.precioVenta) * 100).toFixed(1) : "0";

                        return (
                          <tr key={job.id} className="hover:bg-zinc-800/40 transition">
                            <td className="p-3.5 text-zinc-400">{job.fecha}</td>
                            <td className="p-3.5 font-sans font-bold text-white max-w-xs truncate">{job.nombre}</td>
                            <td className="p-3.5 font-sans text-zinc-300">{job.cliente}</td>
                            <td className="p-3.5 text-zinc-300">${job.costoFilamento.toFixed(2)}</td>
                            <td className="p-3.5 text-zinc-400">${otherCosts.toFixed(2)}</td>
                            <td className="p-3.5 text-rose-400 font-bold">${job.costoTotal.toFixed(2)}</td>
                            <td className="p-3.5 text-zinc-100 font-bold">${job.precioVenta.toFixed(2)}</td>
                            <td className="p-3.5 text-emerald-400 font-bold">+${job.gananciaNeta.toFixed(2)}</td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {margin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: COTIZADOR (.3MF REAL FILE PROCESSOR)                       */}
        {/* ================================================================= */}
        {activeTab === "calculator" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Slicer .3mf Dropzone Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: Slicer File Upload & Inputs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      Parser Real Bambu Studio (.3MF ZIP)
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                        sliceData ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {sliceData ? "✓ Metadatos Extraídos" : "Esperando .3mf"}
                    </span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed transition-all duration-200 rounded-2xl p-7 text-center cursor-pointer group ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-zinc-700 hover:border-emerald-500/80 bg-zinc-950/60 hover:bg-zinc-950/90"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-zinc-400 flex items-center justify-center transition-all">
                        {isParsing ? <Loader2 className="w-7 h-7 animate-spin text-emerald-400" /> : <FileCheck2 className="w-7 h-7 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition">{fileName}</p>
                        <p className="text-xs text-zinc-400 mt-1">Arrastra tu archivo .3mf o haz clic para seleccionarlo</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <span>Parámetros de Fabricación</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Impresora Bambu</label>
                      <select
                        value={selectedPrinterId}
                        onChange={(e) => setSelectedPrinterId(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {printers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.consumo_kw} kW)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Bobina de Filamento</label>
                      <select
                        value={selectedSpoolId}
                        onChange={(e) => setSelectedSpoolId(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {spools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.marca} {s.material} - {s.color} ({s.peso_actual_g}g disp)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Peso (gramos)</label>
                      <input
                        type="number"
                        value={grams}
                        onChange={(e) => setGrams(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Tiempo Impresión (min)</label>
                      <input
                        type="number"
                        value={printTimeMin}
                        onChange={(e) => setPrintTimeMin(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1 font-medium">Mano de Obra (min)</label>
                      <input
                        type="number"
                        value={operatorTimeMin}
                        onChange={(e) => setOperatorTimeMin(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-zinc-400 font-medium">Margen de Ganancia Deseado</span>
                      <span className="font-mono font-bold text-emerald-400">+{marginPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={400}
                      step={10}
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Results Card (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-white">Resumen de Cotización & Costos</h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Margen +{marginPercent}%
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Filamento ({grams}g):</span>
                      <span className="font-mono font-bold text-white">${calculations.costFilament.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Energía ({calculations.printHours.toFixed(2)}h):</span>
                      <span className="font-mono font-bold text-white">${calculations.costElectricity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Desgaste Máquina:</span>
                      <span className="font-mono font-bold text-white">${calculations.costMachine.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Mano de Obra:</span>
                      <span className="font-mono font-bold text-white">${calculations.costLabor.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-zinc-300">Costo Total de Producción:</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">${calculations.totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 space-y-2">
                    <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">Precio Sugerido de Venta</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                        ${calculations.suggestedPrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Ganancia: <strong className="text-emerald-300">+${calculations.netProfit.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmOrder}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar y Enviar a Cola de Producción</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: INVENTARIO DE BOBINAS                                      */}
        {/* ================================================================= */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Bobinas Registradas</span>
                  <Disc className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white font-mono">{spools.length}</div>
                <div className="mt-1 text-xs text-zinc-500">100% calibradas</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Stock Total</span>
                  <Scale className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white font-mono">{inventoryStats.totalWeight}g</div>
                <div className="mt-1 text-xs text-zinc-500">{(inventoryStats.totalWeight / 1000).toFixed(2)} kg activos</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Valor en Stock</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white font-mono">${inventoryStats.totalCapital.toFixed(2)}</div>
                <div className="mt-1 text-xs text-zinc-500">Valorizado por gramo</div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                  <span>Alertas Stock Bajo</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2 text-3xl font-extrabold text-rose-400 font-mono">{inventoryStats.lowStockCount}</div>
                <div className="mt-1 text-xs text-zinc-500">Bobina &lt; 20%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {spools.map((spool) => {
                const percent = Math.round((spool.peso_actual_g / spool.peso_total_g) * 100);
                const costPerGram = spool.costo_compra / spool.peso_total_g;

                return (
                  <div key={spool.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: spool.hex }} />
                          <span className="text-xs font-bold uppercase font-mono text-zinc-300">{spool.marca}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded-full border bg-zinc-800 text-zinc-300">
                          {percent}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-base font-bold text-white">{spool.material}</h4>
                        <p className="text-xs text-zinc-400">Color: {spool.color}</p>
                      </div>
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-400">Disponible:</span>
                          <span className="font-bold text-white">
                            {spool.peso_actual_g}g / {spool.peso_total_g}g
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Costo/g</span>
                        <span className="font-mono font-bold text-emerald-400">${costPerGram.toFixed(3)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase">Valor Actual</span>
                        <span className="font-mono text-zinc-300">${(spool.peso_actual_g * costPerGram).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NUEVO TRABAJO RÁPIDO */}
      {modalTrabajoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cargar Nuevo Trabajo a la Flota</h3>
                  <p className="text-xs text-zinc-400">Registrar pieza en cola de espera o ejecución</p>
                </div>
              </div>
              <button onClick={() => setModalTrabajoOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoTrabajo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Nombre de la Pieza / Archivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Soporte Monitor VESA_v3.3mf"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Cliente / Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Tech Cuyo"
                    value={newJobClient}
                    onChange={(e) => setNewJobClient(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Prioridad</label>
                  <select
                    value={newJobPriority}
                    onChange={(e) => setNewJobPriority(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="alta">Alta (Urgente)</option>
                    <option value="media">Media (Normal)</option>
                    <option value="baja">Baja (Sin apuro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Impresora Asignada</label>
                  <select
                    value={newJobPrinterId}
                    onChange={(e) => setNewJobPrinterId(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {printers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Bobina / Filamento</label>
                  <select
                    value={newJobSpoolId}
                    onChange={(e) => setNewJobSpoolId(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {spools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.marca} {s.material} - {s.color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Gramos (g)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newJobGrams}
                    onChange={(e) => setNewJobGrams(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Tiempo (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newJobTimeMin}
                    onChange={(e) => setNewJobTimeMin(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Margen %</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newJobMargin}
                    onChange={(e) => setNewJobMargin(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalTrabajoOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Agregar Trabajo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO ACTIVO INVERSIÓN */}
      {modalInversionOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Activo o Inversión</h3>
                  <p className="text-xs text-zinc-400">Suma al capital invertido para el cálculo de ROI</p>
                </div>
              </div>
              <button onClick={() => setModalInversionOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoActivo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Categoría</label>
                <select
                  value={newAssetCategory}
                  onChange={(e) => setNewAssetCategory(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="maquinaria">Impresora / Máquina 3D</option>
                  <option value="herramientas">Herramienta, Accesorio o Repuesto</option>
                  <option value="insumos">Lote de Filamentos / Insumos Base</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Nombre o Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AMS Bambu 4-colores adicional"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Costo ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  value={newAssetCost}
                  onChange={(e) => setNewAssetCost(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalInversionOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Sumar a Inversión</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
