export interface MaterialCalculoDTO {
  filamentoId?: number | null;
  colorNombre: string;
  colorHex: string;
  tipoMaterial: string;
  gramosUsados: number;
  slotAms?: number | null;
  costoGramoReferencia?: number;
}

export interface ItemCalculoDTO {
  descripcion: string;
  cantidad: number;
  tiempoMinutosUnitario: number;
  tiempoOperadorMinutos?: number;
  impresoraId?: number | null;
  margenPorcentaje?: number;
  productoId?: number | null;
  modeloImpresionId?: number | null;
  materiales: MaterialCalculoDTO[];
}

export interface CalcularPresupuestoDTO {
  descuentoPorcentaje?: number;
  items: ItemCalculoDTO[];
}

export interface MaterialCalculadoResponse {
  filamentoId: number | null;
  slot_ams: number | null;
  color_nombre: string;
  color_hex: string;
  tipo_material: string;
  gramos_usados: number;
  costo_calculado: string | number;
}

export interface ItemCalculadoResponse {
  productoId?: number | null;
  modeloImpresionId?: number | null;
  descripcion: string;
  cantidad: number;
  tiempo_minutos_unitario: number;
  gramos_filamento_unitario: number;
  costo_filamento_unitario: string | number;
  costo_energia_unitario: string | number;
  costo_operador_unitario: string | number;
  costo_amortizacion_unitario: string | number;
  costo_total_unitario: string | number;
  margen_porcentaje: number;
  precio_unitario: string | number;
  subtotal: string | number;
  materiales: MaterialCalculadoResponse[];
}

export interface PresupuestoCalculadoResponse {
  costo_total_calculado: string | number;
  precio_subtotal: string | number;
  descuento_porcentaje: number;
  precio_final: string | number;
  items: ItemCalculadoResponse[];
}

export interface CrearCotizacionDTO {
  clienteId?: number | null;
  clienteNombreSnapshot: string;
  clienteTelefonoSnapshot?: string | null;
  notas?: string | null;
  fechaVencimiento?: string | null;
  descuentoPorcentaje?: number;
  items: ItemCalculoDTO[];
}

export interface CotizacionCreadaResponse {
  id: number;
  codigo_cotizacion: string;
  clienteId: number | null;
  cliente_nombre_snapshot: string;
  cliente_telefono_snapshot: string | null;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  costo_total_calculado: string | number;
  precio_subtotal: string | number;
  descuento_porcentaje: number;
  precio_final: string | number;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialSlotUI {
  slot_ams: number;
  color_nombre: string;
  color_hex: string;
  tipo_material: string;
  gramos_usados: number;
  filamentoId?: number | null;
  bobinaId?: number | null;
  costo_calculado?: string | number;
}
