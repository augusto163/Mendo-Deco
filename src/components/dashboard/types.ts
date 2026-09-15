export interface ConfiguracionCostos {
  id: number;
  costo_kwh: number;
  costo_hora_operador: number;
  margen_ganancia_default: number;
  tasa_fallo_default?: number;
}

export interface Impresora {
  id: number;
  nombre: string;
  modelo?: string;
  consumo_kw: number;
  costo_maquina: number;
  horas_vida_util: number;
  horas_uso_actual?: number;
  estado?: string; // DISPONIBLE, IMPRIMIENDO, MANTENIMIENTO, INACTIVA
  trabajos?: Array<{
    id: number;
    codigo_orden: string;
    nombre_archivo: string;
    tiempo_minutos: number;
    progreso_porcentaje: number;
  }>;
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
  costo_gramo?: number;
  estado?: string;
  ubicacion_slot_ams?: string | null;
}

export interface ActivoInversion {
  id: number;
  nombre: string;
  costo: number;
  categoria: "maquinaria" | "herramientas" | "insumos";
  fecha?: string;
}

export interface TrabajoMaterialAms {
  id?: number;
  bobinaId: number;
  slot_ams: number;
  color_nombre: string;
  color_hex: string;
  gramos_usados: number;
  costo_calculado: number;
  bobina?: Bobina;
}

export interface Trabajo {
  id: number;
  codigo: string;
  nombre: string;
  cliente: string;
  clienteTelefono?: string;
  impresoraId: number | null;
  impresoraNombre?: string;
  material: string;
  color: string;
  colorHex?: string;
  bobinaId?: number;
  pesoGramos: number;
  tiempoMinutos: number;
  tiempoTranscurridoMin: number;
  estado: "ejecucion" | "espera" | "completado" | "cancelado";
  costoFilamento: number;
  costoElectricidad: number;
  costoAmortizacion: number;
  costoManoObra: number;
  costoTotal: number;
  precioVenta: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  progresoPorcentaje: number;
  fecha: string;
  prioridad: "alta" | "media" | "baja";
  materialesAms?: TrabajoMaterialAms[];
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  notas?: string;
}

export interface ContabilidadResumen {
  facturacionTotal: number;
  costoOperativoTotal: number;
  gananciaNetaTotal: number;
  inversionTotal: number;
  roiPorcentaje: number;
  margenPromedio: number;
  costoFilamentoTotal: number;
  costoEnergiaTotal: number;
  costoAmortizacionTotal: number;
  costoOperadorTotal: number;
  gramosTotales: number;
  trabajosCompletadosCount: number;
}
