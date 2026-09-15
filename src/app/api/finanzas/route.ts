import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.configuracion.findFirst();
    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          id: 1,
          costo_kwh: 120.0,
          costo_hora_operador: 2500.0,
          margen_ganancia_default: 40.0,
          tasa_fallo_default: 5.0,
          inversion_inicial: 3226.0,
        },
      });
    }

    const activos = await prisma.activoInversion.findMany({
      orderBy: { fecha: "desc" },
    });

    const trabajosCompletados = await prisma.trabajoProduccion.findMany({
      where: { estado: "COMPLETADO" },
    });

    const facturacionTotal = trabajosCompletados.reduce((acc, t) => acc + t.precio_venta, 0);
    const costoOperativoTotal = trabajosCompletados.reduce((acc, t) => acc + t.costo_total, 0);
    const gananciaNetaTotal = facturacionTotal - costoOperativoTotal;

    const costoFilamentoTotal = trabajosCompletados.reduce((acc, t) => acc + t.costo_filamento, 0);
    const costoEnergiaTotal = trabajosCompletados.reduce((acc, t) => acc + t.costo_energia, 0);
    const costoAmortizacionTotal = trabajosCompletados.reduce((acc, t) => acc + t.costo_amortizacion, 0);
    const costoOperadorTotal = trabajosCompletados.reduce((acc, t) => acc + t.costo_operador, 0);
    const gramosTotales = trabajosCompletados.reduce((acc, t) => acc + t.gramos_filamento, 0);

    const inversionActivos = activos.reduce((acc, a) => acc + a.costo, 0);
    const inversionTotal = inversionActivos > 0 ? inversionActivos : config.inversion_inicial;

    const roiPorcentaje = inversionTotal > 0 ? (gananciaNetaTotal / inversionTotal) * 100 : 0;
    const margenPromedio = facturacionTotal > 0 ? (gananciaNetaTotal / facturacionTotal) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        config,
        activos,
        contabilidad: {
          facturacionTotal,
          costoOperativoTotal,
          gananciaNetaTotal,
          inversionTotal,
          roiPorcentaje,
          margenPromedio,
          costoFilamentoTotal,
          costoEnergiaTotal,
          costoAmortizacionTotal,
          costoOperadorTotal,
          gramosTotales,
          trabajosCompletadosCount: trabajosCompletados.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching finances:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevoActivo = await prisma.activoInversion.create({
      data: {
        nombre: body.nombre || "Nuevo Activo",
        categoria: body.categoria || "Herramientas",
        costo: Number(body.costo) || 0,
      },
    });

    // Actualizar total de inversión en Configuración
    const todosActivos = await prisma.activoInversion.findMany();
    const totalInversion = todosActivos.reduce((acc, a) => acc + a.costo, 0);
    await prisma.configuracion.upsert({
      where: { id: 1 },
      create: { id: 1, inversion_inicial: totalInversion },
      update: { inversion_inicial: totalInversion },
    });

    return NextResponse.json({ success: true, data: nuevoActivo, totalInversion });
  } catch (error: any) {
    console.error("Error creating asset:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const actualizada = await prisma.configuracion.update({
      where: { id: 1 },
      data: {
        ...(body.costo_kwh !== undefined && { costo_kwh: Number(body.costo_kwh) }),
        ...(body.costo_hora_operador !== undefined && { costo_hora_operador: Number(body.costo_hora_operador) }),
        ...(body.margen_ganancia_default !== undefined && { margen_ganancia_default: Number(body.margen_ganancia_default) }),
        ...(body.tasa_fallo_default !== undefined && { tasa_fallo_default: Number(body.tasa_fallo_default) }),
      },
    });
    return NextResponse.json({ success: true, data: actualizada });
  } catch (error: any) {
    console.error("Error updating config:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
