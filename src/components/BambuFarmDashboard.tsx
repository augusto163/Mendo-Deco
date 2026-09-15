"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HeaderNav } from "./dashboard/HeaderNav";
import { CotizadorPanel } from "./dashboard/Cotizador/CotizadorPanel";
import { FlotaPanel } from "./dashboard/Flota/FlotaPanel";
import { FilamentosPanel } from "./dashboard/Filamentos/FilamentosPanel";
import { ColaProduccionPanel } from "./dashboard/Produccion/ColaProduccionPanel";
import { FinanzasPanel } from "./dashboard/Finanzas/FinanzasPanel";
import {
  ConfiguracionCostos,
  Impresora,
  Bobina,
  ActivoInversion,
  Trabajo,
  ContabilidadResumen,
} from "./dashboard/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function BambuFarmDashboard() {
  const [activeTab, setActiveTab] = useState<
    "cotizador" | "flota" | "filamentos" | "produccion" | "finanzas"
  >("cotizador");

  // Global State
  const [config, setConfig] = useState<ConfiguracionCostos>({
    id: 1,
    costo_kwh: 120.0,
    costo_hora_operador: 2500.0,
    margen_ganancia_default: 40.0,
    tasa_fallo_default: 5.0,
  });

  const [printers, setPrinters] = useState<Impresora[]>([]);
  const [spools, setSpools] = useState<Bobina[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [activos, setActivos] = useState<ActivoInversion[]>([]);
  const [contabilidad, setContabilidad] = useState<ContabilidadResumen>({
    facturacionTotal: 0,
    costoOperativoTotal: 0,
    gananciaNetaTotal: 0,
    inversionTotal: 3226.0,
    roiPorcentaje: 0,
    margenPromedio: 0,
    costoFilamentoTotal: 0,
    costoEnergiaTotal: 0,
    costoAmortizacionTotal: 0,
    costoOperadorTotal: 0,
    gramosTotales: 0,
    trabajosCompletadosCount: 0,
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  }, []);

  // Fetch all data from Supabase backend
  const loadDataFromBackend = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Filamentos / Bobinas
      const resFilamentos = await fetch("/api/filamentos");
      const jsonFilamentos = await resFilamentos.json();
      if (jsonFilamentos.success && Array.isArray(jsonFilamentos.data)) {
        setSpools(
          jsonFilamentos.data.map((b: any) => ({
            id: b.id,
            marca: b.marca,
            material: b.material,
            color: b.color_nombre,
            hex: b.color_hex,
            peso_total_g: b.peso_inicial_g,
            peso_actual_g: b.peso_actual_g,
            costo_compra: b.costo_kg,
            costo_gramo: b.costo_gramo,
            estado: b.estado,
            ubicacion_slot_ams: b.ubicacion_slot_ams,
          }))
        );
      }

      // 2. Impresoras
      const resImpresoras = await fetch("/api/impresoras");
      const jsonImpresoras = await resImpresoras.json();
      if (jsonImpresoras.success && Array.isArray(jsonImpresoras.data)) {
        setPrinters(jsonImpresoras.data);
      }

      // 3. Trabajos
      const resTrabajos = await fetch("/api/trabajos");
      const jsonTrabajos = await resTrabajos.json();
      if (jsonTrabajos.success && Array.isArray(jsonTrabajos.data)) {
        setTrabajos(
          jsonTrabajos.data.map((t: any) => {
            let estado: "ejecucion" | "espera" | "completado" | "cancelado" = "espera";
            if (t.estado === "EN_PROCESO") estado = "ejecucion";
            else if (t.estado === "COMPLETADO") estado = "completado";
            else if (t.estado === "CANCELADO") estado = "cancelado";

            return {
              id: t.id,
              codigo: t.codigo_orden,
              nombre: t.nombre_archivo,
              cliente: t.cliente,
              clienteTelefono: t.cliente_telefono,
              impresoraId: t.impresoraId,
              impresoraNombre: t.impresora?.nombre || t.impresora_asignada || "Auto",
              material: t.material,
              color: t.color,
              colorHex: t.color_hex,
              pesoGramos: t.gramos_filamento,
              tiempoMinutos: t.tiempo_minutos,
              tiempoTranscurridoMin: Math.round(
                (t.tiempo_minutos * (t.progreso_porcentaje || 0)) / 100
              ),
              estado,
              costoFilamento: t.costo_filamento,
              costoElectricidad: t.costo_energia,
              costoAmortizacion: t.costo_amortizacion,
              costoManoObra: t.costo_operador,
              costoTotal: t.costo_total,
              precioVenta: t.precio_venta,
              gananciaNeta: t.ganancia_neta,
              margenPorcentaje: t.margen_porcentaje,
              progresoPorcentaje: t.progreso_porcentaje || 0,
              fecha: t.fecha_creacion ? t.fecha_creacion.split("T")[0] : "2026-09-15",
              prioridad: (t.prioridad || "media").toLowerCase() as "alta" | "media" | "baja",
              materialesAms: t.materiales_ams || [],
            };
          })
        );
      }

      // 4. Finanzas y Activos
      const resFinanzas = await fetch("/api/finanzas");
      const jsonFinanzas = await resFinanzas.json();
      if (jsonFinanzas.success && jsonFinanzas.data) {
        if (jsonFinanzas.data.config) {
          setConfig(jsonFinanzas.data.config);
        }
        if (Array.isArray(jsonFinanzas.data.activos)) {
          setActivos(
            jsonFinanzas.data.activos.map((a: any) => ({
              id: a.id,
              nombre: a.nombre,
              costo: a.costo,
              categoria: a.categoria?.toLowerCase() || "herramientas",
              fecha: a.fecha ? a.fecha.split("T")[0] : "2026-09-15",
            }))
          );
        }
        if (jsonFinanzas.data.contabilidad) {
          setContabilidad(jsonFinanzas.data.contabilidad);
        }
      }
    } catch (err) {
      console.warn("Error cargando datos de Supabase:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadDataFromBackend();
  }, [loadDataFromBackend]);

  // Order creation from Cotizador
  const handleOrderCreated = async (jobPayload: any) => {
    const res = await fetch("/api/trabajos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobPayload),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "No se pudo registrar la orden en Supabase");
    }
    await loadDataFromBackend();
    setActiveTab("produccion");
  };

  // Spool ABM
  const handleSaveSpool = async (spoolData: Partial<Bobina>) => {
    if (spoolData.id) {
      // Edit
      const res = await fetch("/api/filamentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: spoolData.id,
          marca: spoolData.marca,
          material: spoolData.material,
          color_nombre: spoolData.color,
          color_hex: spoolData.hex,
          peso_inicial_g: spoolData.peso_total_g,
          peso_actual_g: spoolData.peso_actual_g,
          costo_kg: spoolData.costo_compra,
          ubicacion_slot_ams: spoolData.ubicacion_slot_ams,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al actualizar bobina");
      showToast(`✓ Bobina "${spoolData.marca} ${spoolData.material}" actualizada en Supabase.`);
    } else {
      // Create
      const res = await fetch("/api/filamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marca: spoolData.marca,
          material: spoolData.material,
          color_nombre: spoolData.color,
          color_hex: spoolData.hex,
          peso_inicial_g: spoolData.peso_total_g,
          peso_actual_g: spoolData.peso_actual_g,
          costo_kg: spoolData.costo_compra,
          ubicacion_slot_ams: spoolData.ubicacion_slot_ams,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al crear bobina");
      showToast(`✓ Nueva bobina "${spoolData.marca} ${spoolData.material}" guardada en Supabase.`);
    }
    await loadDataFromBackend();
  };

  const handleDeleteSpool = async (id: number) => {
    const res = await fetch(`/api/filamentos?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al eliminar bobina");
    showToast("🗑️ Bobina eliminada del inventario.");
    await loadDataFromBackend();
  };

  // Printer ABM
  const handleSavePrinter = async (printerData: Partial<Impresora>) => {
    if (printerData.id) {
      const res = await fetch("/api/impresoras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(printerData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al actualizar impresora");
      showToast(`✓ Impresora "${printerData.nombre || ""}" actualizada.`);
    } else {
      const res = await fetch("/api/impresoras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(printerData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al crear impresora");
      showToast(`✓ Impresora "${printerData.nombre || ""}" registrada.`);
    }
    await loadDataFromBackend();
  };

  const handleDeletePrinter = async (id: number) => {
    const res = await fetch(`/api/impresoras?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al eliminar impresora");
    showToast("🗑️ Impresora eliminada de la flota.");
    await loadDataFromBackend();
  };

  // Job Actions
  const handleIniciarTrabajo = async (jobId: number) => {
    // Buscar una impresora disponible
    const freePrinter = printers.find(
      (p) => p.estado === "DISPONIBLE" || !trabajos.some((t) => t.impresoraId === p.id && t.estado === "ejecucion")
    );

    const res = await fetch("/api/trabajos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: jobId,
        estado: "EN_PROCESO",
        impresoraId: freePrinter ? freePrinter.id : undefined,
        impresora_asignada: freePrinter ? freePrinter.nombre : undefined,
        progreso_porcentaje: 10,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al iniciar trabajo");
    showToast(`🚀 ¡Trabajo iniciado${freePrinter ? ` en ${freePrinter.nombre}` : ""}!`);
    await loadDataFromBackend();
  };

  const handleCompletarTrabajo = async (jobId: number) => {
    const res = await fetch("/api/trabajos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: jobId,
        estado: "COMPLETADO",
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al completar trabajo");
    showToast("✅ ¡Trabajo completado! Stock descontado y contabilizado automáticamente.");
    await loadDataFromBackend();
  };

  const handleCancelarTrabajo = async (jobId: number) => {
    const res = await fetch(`/api/trabajos?id=${jobId}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al cancelar trabajo");
    showToast("🗑️ Trabajo cancelado y eliminado.");
    await loadDataFromBackend();
  };

  // Finance Actions
  const handleSaveConfig = async (cfg: Partial<ConfiguracionCostos>) => {
    const res = await fetch("/api/finanzas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al guardar tarifas");
    await loadDataFromBackend();
  };

  const handleSaveActivo = async (activo: Partial<ActivoInversion>) => {
    const res = await fetch("/api/finanzas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activo),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Error al registrar activo");
    showToast(`✓ Activo "${activo.nombre}" sumado a la inversión de la empresa.`);
    await loadDataFromBackend();
  };

  const jobsEnEjecucionCount = trabajos.filter((t) => t.estado === "ejecucion").length;
  const jobsEnEsperaCount = trabajos.filter((t) => t.estado === "espera").length;
  const lowStockCount = spools.filter(
    (s) => (s.peso_actual_g / (s.peso_total_g || 1000)) * 100 < 20
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        onRefresh={loadDataFromBackend}
        jobsEnEjecucionCount={jobsEnEjecucionCount}
        jobsEnEsperaCount={jobsEnEsperaCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "cotizador" && (
          <CotizadorPanel
            printers={printers}
            spools={spools}
            config={config}
            onOrderCreated={handleOrderCreated}
            showToast={showToast}
          />
        )}

        {activeTab === "flota" && (
          <FlotaPanel
            printers={printers}
            trabajos={trabajos}
            onSavePrinter={handleSavePrinter}
            onDeletePrinter={handleDeletePrinter}
            showToast={showToast}
          />
        )}

        {activeTab === "filamentos" && (
          <FilamentosPanel
            spools={spools}
            onSaveSpool={handleSaveSpool}
            onDeleteSpool={handleDeleteSpool}
            showToast={showToast}
          />
        )}

        {activeTab === "produccion" && (
          <ColaProduccionPanel
            trabajos={trabajos}
            printers={printers}
            onIniciarTrabajo={handleIniciarTrabajo}
            onCompletarTrabajo={handleCompletarTrabajo}
            onCancelarTrabajo={handleCancelarTrabajo}
            showToast={showToast}
          />
        )}

        {activeTab === "finanzas" && (
          <FinanzasPanel
            config={config}
            activos={activos}
            contabilidad={contabilidad}
            trabajos={trabajos}
            onSaveConfig={handleSaveConfig}
            onSaveActivo={handleSaveActivo}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}
