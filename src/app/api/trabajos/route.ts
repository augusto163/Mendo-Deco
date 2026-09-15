import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trabajos = await prisma.trabajoProduccion.findMany({
      orderBy: { fecha_creacion: "desc" },
    });
    return NextResponse.json({ success: true, data: trabajos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const count = await prisma.trabajoProduccion.count();
    const codigoOrden = body.codigo_orden || `TRB-${100 + count + 1}`;

    const nuevoTrabajo = await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: codigoOrden,
        nombre_archivo: body.nombre_archivo || "modelo.3mf",
        cliente: body.cliente || "Cliente Particular",
        cliente_telefono: body.cliente_telefono || null,
        material: body.material || "PLA+",
        color: body.color || "Negro",
        color_hex: body.color_hex || "#1e293b",
        impresora_asignada: body.impresora_asignada || null,
        estado: body.estado || "EN_ESPERA",
        prioridad: body.prioridad || "MEDIA",
        tiempo_minutos: Number(body.tiempo_minutos) || 60,
        gramos_filamento: Number(body.gramos_filamento) || 50,
        costo_energia: Number(body.costo_energia) || 1.0,
        costo_operador: Number(body.costo_operador) || 2.0,
        costo_filamento: Number(body.costo_filamento) || 1.5,
        costo_amortizacion: Number(body.costo_amortizacion) || 1.0,
        costo_total: Number(body.costo_total) || 5.5,
        precio_venta: Number(body.precio_venta) || 15.0,
        ganancia_neta: Number(body.ganancia_neta) || 9.5,
        margen_porcentaje: Number(body.margen_porcentaje) || 63.3,
        progreso_porcentaje: Number(body.progreso_porcentaje) || 0,
      },
    });

    return NextResponse.json({ success: true, data: nuevoTrabajo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const actualizado = await prisma.trabajoProduccion.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ success: true, data: actualizado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    await prisma.trabajoProduccion.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
