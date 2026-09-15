import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bobinas = await prisma.bobinaFilamento.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, data: bobinas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevaBobina = await prisma.bobinaFilamento.create({
      data: {
        marca: body.marca,
        material: body.material,
        color_nombre: body.color_nombre,
        color_hex: body.color_hex || "#3b82f6",
        peso_inicial_g: Number(body.peso_inicial_g) || 1000,
        peso_actual_g: Number(body.peso_actual_g) || 1000,
        costo_kg: Number(body.costo_kg) || 25,
        costo_gramo: (Number(body.costo_kg) || 25) / 1000,
      },
    });
    return NextResponse.json({ success: true, data: nuevaBobina });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const actualizada = await prisma.bobinaFilamento.update({
      where: { id: Number(id) },
      data,
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
    await prisma.bobinaFilamento.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
