import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      include: {
        pedidos: {
          select: {
            id: true,
            codigo_pedido: true,
            estado: true,
            precio_total: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: clientes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.nombre) {
      return NextResponse.json({ success: false, error: "Nombre de cliente es requerido" }, { status: 400 });
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre,
        telefono: body.telefono || null,
        email: body.email || null,
        empresa: body.empresa || null,
        notas: body.notas || null,
      },
    });
    return NextResponse.json({ success: true, data: nuevoCliente });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
