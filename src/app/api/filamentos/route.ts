import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bobinas = await prisma.bobinaFilamento.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { materiales_usados: true },
        },
      },
    });
    return NextResponse.json({ success: true, data: bobinas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pesoInicial = Number(body.peso_inicial_g) || 1000;
    const pesoActual = body.peso_actual_g !== undefined ? Number(body.peso_actual_g) : pesoInicial;
    const costoKg = Number(body.costo_kg) || 24;
    const costoGramo = pesoInicial > 0 ? costoKg / pesoInicial : 0.024;

    const nuevaBobina = await prisma.bobinaFilamento.create({
      data: {
        marca: body.marca || "Genérico",
        material: body.material || "PLA",
        color_nombre: body.color_nombre || "Blanco",
        color_hex: body.color_hex || "#f8fafc",
        peso_inicial_g: pesoInicial,
        peso_actual_g: pesoActual,
        costo_kg: costoKg,
        costo_gramo: costoGramo,
        estado: body.estado || "EN_USO",
        ubicacion_slot_ams: body.ubicacion_slot_ams || null,
      },
    });
    return NextResponse.json({ success: true, data: nuevaBobina });
  } catch (error: any) {
    console.error("Error creating spool:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const numId = Number(id);
    if (isNaN(numId) || numId > 2147483647) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.marca) updateData.marca = data.marca;
    if (data.material) updateData.material = data.material;
    if (data.color_nombre) updateData.color_nombre = data.color_nombre;
    if (data.color_hex) updateData.color_hex = data.color_hex;
    if (data.peso_inicial_g !== undefined) updateData.peso_inicial_g = Number(data.peso_inicial_g);
    if (data.peso_actual_g !== undefined) {
      const pAct = Number(data.peso_actual_g);
      updateData.peso_actual_g = pAct;
      if (pAct <= 0) updateData.estado = "AGOTADA";
    }
    if (data.costo_kg !== undefined) updateData.costo_kg = Number(data.costo_kg);
    if (data.costo_gramo !== undefined) {
      updateData.costo_gramo = Number(data.costo_gramo);
    } else if (data.costo_kg !== undefined && data.peso_inicial_g !== undefined) {
      updateData.costo_gramo = Number(data.costo_kg) / Number(data.peso_inicial_g);
    }
    if (data.estado) updateData.estado = data.estado;
    if (data.ubicacion_slot_ams !== undefined) updateData.ubicacion_slot_ams = data.ubicacion_slot_ams;

    const actualizada = await prisma.bobinaFilamento.update({
      where: { id: numId },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: actualizada });
  } catch (error: any) {
    console.error("Error updating spool:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const numId = Number(id);
    if (isNaN(numId) || numId > 2147483647) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    await prisma.bobinaFilamento.delete({
      where: { id: numId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting spool:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
