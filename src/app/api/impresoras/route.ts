import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const impresoras = await prisma.impresora.findMany({
      orderBy: { id: "asc" },
      include: {
        trabajos: {
          where: { estado: "EN_PROCESO" },
          select: {
            id: true,
            codigo_orden: true,
            nombre_archivo: true,
            tiempo_minutos: true,
            progreso_porcentaje: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: impresoras });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevaImpresora = await prisma.impresora.create({
      data: {
        nombre: body.nombre || "Bambu Lab P1S",
        modelo: body.modelo || "P1S",
        consumo_kw: Number(body.consumo_kw) || 0.28,
        costo_maquina: Number(body.costo_maquina) || 950.0,
        horas_vida_util: Number(body.horas_vida_util) || 8000,
        horas_uso_actual: Number(body.horas_uso_actual) || 0.0,
        estado: body.estado || "DISPONIBLE",
      },
    });
    return NextResponse.json({ success: true, data: nuevaImpresora });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const actualizada = await prisma.impresora.update({
      where: { id: Number(id) },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.modelo && { modelo: data.modelo }),
        ...(data.consumo_kw !== undefined && { consumo_kw: Number(data.consumo_kw) }),
        ...(data.costo_maquina !== undefined && { costo_maquina: Number(data.costo_maquina) }),
        ...(data.horas_vida_util !== undefined && { horas_vida_util: Number(data.horas_vida_util) }),
        ...(data.horas_uso_actual !== undefined && { horas_uso_actual: Number(data.horas_uso_actual) }),
        ...(data.estado && { estado: data.estado }),
      },
    });
    return NextResponse.json({ success: true, data: actualizada });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    await prisma.impresora.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
