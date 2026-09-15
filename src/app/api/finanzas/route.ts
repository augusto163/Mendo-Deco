import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.configuracion.findFirst() || {
      id: 1,
      costo_kwh: 120.0,
      costo_hora_operador: 2500.0,
      margen_ganancia_default: 40.0,
      inversion_inicial: 3226.0,
    };
    const activos = await prisma.activoInversion.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, data: { config, activos } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevoActivo = await prisma.activoInversion.create({
      data: {
        nombre: body.nombre,
        categoria: body.categoria || "Herramientas",
        costo: Number(body.costo) || 0,
      },
    });

    // Actualizar total en Configuracion
    const todosActivos = await prisma.activoInversion.findMany();
    const totalInversion = todosActivos.reduce((acc, a) => acc + a.costo, 0);
    await prisma.configuracion.upsert({
      where: { id: 1 },
      create: { id: 1, inversion_inicial: totalInversion },
      update: { inversion_inicial: totalInversion },
    });

    return NextResponse.json({ success: true, data: nuevoActivo, totalInversion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
