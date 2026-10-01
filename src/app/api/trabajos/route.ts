import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trabajos = await prisma.trabajoProduccion.findMany({
      orderBy: { fecha_creacion: "desc" },
      include: {
        impresora: true,
        materiales_ams: {
          include: {
            bobina: true,
          },
        },
      },
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

    const impresoraId = body.impresoraId ? Number(body.impresoraId) : null;
    const estado = body.estado || "EN_ESPERA";
    const cantidad = Math.max(1, Number(body.cantidad) || 1);
    const tipoDestino = body.tipo_destino || (body.cliente && body.cliente !== "Cliente Particular" ? "CLIENTE" : "STOCK");

    const nuevoTrabajo = await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: codigoOrden,
        nombre_archivo: body.nombre_archivo || "modelo.3mf",
        cliente: body.cliente || "Cliente Particular",
        cliente_telefono: body.cliente_telefono || null,
        material: body.material || "PLA+",
        color: body.color || "Varios",
        color_hex: body.color_hex || "#1e293b",
        impresoraId: impresoraId,
        impresora_asignada: body.impresora_asignada || null,
        estado: estado,
        prioridad: body.prioridad || "MEDIA",
        cantidad: cantidad,
        tipo_destino: tipoDestino,
        estado_venta: "PENDIENTE_VENTA",
        unidades_en_stock: 0,
        unidades_vendidas: 0,
        tiempo_minutos: Number(body.tiempo_minutos) || 60,
        tiempo_operador_min: Number(body.tiempo_operador_min) || 15,
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
        ...(Array.isArray(body.materiales_ams) && body.materiales_ams.length > 0
          ? {
              materiales_ams: {
                create: body.materiales_ams.map((m: any) => ({
                  bobinaId: m.bobinaId ? Number(m.bobinaId) : null,
                  slot_ams: Number(m.slot_ams) || 1,
                  color_nombre: m.color_nombre || "Color AMS",
                  color_hex: m.color_hex || "#3b82f6",
                  gramos_usados: Number(m.gramos_usados) || 0,
                  costo_calculado: Number(m.costo_calculado) || 0,
                })),
              },
            }
          : {}),
      },
      include: {
        impresora: true,
        materiales_ams: {
          include: {
            bobina: true,
          },
        },
      },
    });

    // Si se envía directamente en ejecución, marcar la impresora como IMPRIMIENDO
    if (estado === "EN_PROCESO" && impresoraId) {
      await prisma.impresora.update({
        where: { id: impresoraId },
        data: { estado: "IMPRIMIENDO" },
      }).catch(err => console.warn("Error actualizando estado de impresora:", err));
    }

    return NextResponse.json({ success: true, data: nuevoTrabajo });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const jobId = Number(id);

    // Obtener el trabajo actual con sus materiales
    const trabajoActual = await prisma.trabajoProduccion.findUnique({
      where: { id: jobId },
      include: { materiales_ams: true },
    });

    if (!trabajoActual) {
      return NextResponse.json({ success: false, error: "Trabajo no encontrado" }, { status: 404 });
    }

    // Caso 1: Registrar Venta de Productos Terminados (Control de Ventas & Stock)
    if (data.accion === "REGISTRAR_VENTA" || data.estado_venta === "VENDIDO") {
      const stockDisponible = trabajoActual.unidades_en_stock > 0 ? trabajoActual.unidades_en_stock : trabajoActual.cantidad;
      const cantAVender = Math.min(stockDisponible, Math.max(1, Number(data.unidades_a_vender) || stockDisponible));
      const nuevoStock = Math.max(0, stockDisponible - cantAVender);
      const nuevasVendidas = (trabajoActual.unidades_vendidas || 0) + cantAVender;
      const nuevoEstadoVenta = nuevoStock === 0 ? "VENDIDO" : "EN_STOCK";

      const ventaActualizada = await prisma.trabajoProduccion.update({
        where: { id: jobId },
        data: {
          unidades_en_stock: nuevoStock,
          unidades_vendidas: nuevasVendidas,
          estado_venta: nuevoEstadoVenta,
          fecha_venta: new Date(),
        },
        include: {
          impresora: true,
          materiales_ams: { include: { bobina: true } },
        },
      });

      return NextResponse.json({ success: true, data: ventaActualizada });
    }

    // Caso 2: Transición a FALLIDO (Reportar falla, descontar solo desperdicio real y registrar merma)
    if (data.estado === "FALLIDO" && trabajoActual.estado !== "FALLIDO") {
      const resultFallo = await prisma.$transaction(async (tx) => {
        const desperdicioGramos = Math.max(0, Number(data.desperdicio_gramos) || 0);
        const progreso = Math.min(100, Math.max(1, Number(data.progreso_porcentaje) || 50));
        const tiempoTranscurrido = Math.max(
          1,
          Number(data.tiempo_transcurrido_min) || Math.round((trabajoActual.tiempo_minutos * progreso) / 100)
        );

        const ratioMaterial =
          trabajoActual.gramos_filamento > 0
            ? Math.min(1, desperdicioGramos / trabajoActual.gramos_filamento)
            : progreso / 100;
        const ratioTiempo = Math.min(1, tiempoTranscurrido / (trabajoActual.tiempo_minutos || 1));

        // 1. Descontar únicamente el material desperdiciado de las bobinas usadas
        for (const mat of trabajoActual.materiales_ams) {
          if (mat.bobinaId && mat.gramos_usados > 0) {
            const bobina = await tx.bobinaFilamento.findUnique({ where: { id: mat.bobinaId } });
            if (bobina) {
              const gramosMerma = Math.round(mat.gramos_usados * ratioMaterial * 10) / 10;
              const nuevoPeso = Math.max(0, bobina.peso_actual_g - gramosMerma);
              await tx.bobinaFilamento.update({
                where: { id: mat.bobinaId },
                data: {
                  peso_actual_g: nuevoPeso,
                  estado: nuevoPeso <= 0 ? "AGOTADA" : bobina.estado,
                },
              });
            }
          }
        }

        if (trabajoActual.materiales_ams.length === 0 && data.bobinaId) {
          const bId = Number(data.bobinaId);
          const bobina = await tx.bobinaFilamento.findUnique({ where: { id: bId } });
          if (bobina) {
            const nuevoPeso = Math.max(0, bobina.peso_actual_g - desperdicioGramos);
            await tx.bobinaFilamento.update({
              where: { id: bId },
              data: {
                peso_actual_g: nuevoPeso,
                estado: nuevoPeso <= 0 ? "AGOTADA" : bobina.estado,
              },
            });
          }
        }

        // 2. Liberar impresora y sumar horas de máquina reales hasta el fallo
        const impId = data.impresoraId ? Number(data.impresoraId) : trabajoActual.impresoraId;
        if (impId) {
          const impresora = await tx.impresora.findUnique({ where: { id: impId } });
          if (impresora) {
            const horasEfectivas = tiempoTranscurrido / 60;
            await tx.impresora.update({
              where: { id: impId },
              data: {
                horas_uso_actual: impresora.horas_uso_actual + horasEfectivas,
                estado: "DISPONIBLE",
              },
            });
          }
        }

        // 3. Recalcular costos reales de la pérdida / merma
        const costoFilamentoPerdido = Math.round(trabajoActual.costo_filamento * ratioMaterial * 100) / 100;
        const costoEnergiaPerdida = Math.round(trabajoActual.costo_energia * ratioTiempo * 100) / 100;
        const costoAmortizacionPerdida = Math.round(trabajoActual.costo_amortizacion * ratioTiempo * 100) / 100;
        const costoTotalPerdido = costoFilamentoPerdido + costoEnergiaPerdida + costoAmortizacionPerdida;

        // 4. Actualizar trabajo a FALLIDO con valores de merma
        const trabajoFallido = await tx.trabajoProduccion.update({
          where: { id: jobId },
          data: {
            estado: "FALLIDO",
            progreso_porcentaje: progreso,
            desperdicio_gramos: desperdicioGramos,
            motivo_fallo: data.motivo_fallo || "Falla durante impresión",
            costo_filamento: costoFilamentoPerdido,
            costo_energia: costoEnergiaPerdida,
            costo_amortizacion: costoAmortizacionPerdida,
            costo_total: costoTotalPerdido,
            precio_venta: 0,
            ganancia_neta: -costoTotalPerdido,
            unidades_en_stock: 0,
            unidades_vendidas: 0,
            estado_venta: "CANCELADO",
            fecha_completado: new Date(),
          },
          include: {
            impresora: true,
            materiales_ams: { include: { bobina: true } },
          },
        });

        return trabajoFallido;
      });

      return NextResponse.json({ success: true, data: resultFallo });
    }

    // Caso 3: Transición a COMPLETADO (Descontar bobinas + Almacenar en Stock + Liberar impresora)
    if (data.estado === "COMPLETADO" && trabajoActual.estado !== "COMPLETADO") {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Actualizar estado del trabajo a COMPLETADO y cargar en stock de productos
        const trabajoActualizado = await tx.trabajoProduccion.update({
          where: { id: jobId },
          data: {
            estado: "COMPLETADO",
            progreso_porcentaje: 100,
            fecha_completado: new Date(),
            unidades_en_stock: trabajoActual.cantidad,
            estado_venta: trabajoActual.tipo_destino === "STOCK" ? "EN_STOCK" : "PENDIENTE_VENTA",
            ...(data.impresoraId && { impresoraId: Number(data.impresoraId) }),
          },
          include: {
            impresora: true,
            materiales_ams: { include: { bobina: true } },
          },
        });

        // 2. Descontar stock de cada bobina usada en AMS
        for (const mat of trabajoActual.materiales_ams) {
          if (mat.bobinaId && mat.gramos_usados > 0) {
            const bobina = await tx.bobinaFilamento.findUnique({ where: { id: mat.bobinaId } });
            if (bobina) {
              const nuevoPeso = Math.max(0, bobina.peso_actual_g - mat.gramos_usados);
              await tx.bobinaFilamento.update({
                where: { id: mat.bobinaId },
                data: {
                  peso_actual_g: nuevoPeso,
                  estado: nuevoPeso <= 0 ? "AGOTADA" : bobina.estado,
                },
              });
            }
          }
        }

        // Si no tenía materiales_ams registrados pero tenía bobinaId suelta en body
        if (trabajoActual.materiales_ams.length === 0 && data.bobinaId) {
          const bId = Number(data.bobinaId);
          const bobina = await tx.bobinaFilamento.findUnique({ where: { id: bId } });
          if (bobina) {
            const nuevoPeso = Math.max(0, bobina.peso_actual_g - trabajoActual.gramos_filamento);
            await tx.bobinaFilamento.update({
              where: { id: bId },
              data: {
                peso_actual_g: nuevoPeso,
                estado: nuevoPeso <= 0 ? "AGOTADA" : bobina.estado,
              },
            });
          }
        }

        // 3. Liberar la impresora y sumar horas de uso acumuladas
        const impId = data.impresoraId ? Number(data.impresoraId) : trabajoActual.impresoraId;
        if (impId) {
          const impresora = await tx.impresora.findUnique({ where: { id: impId } });
          if (impresora) {
            const horasTrabajo = trabajoActual.tiempo_minutos / 60;
            await tx.impresora.update({
              where: { id: impId },
              data: {
                horas_uso_actual: impresora.horas_uso_actual + horasTrabajo,
                estado: "DISPONIBLE",
              },
            });
          }
        }

        return trabajoActualizado;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // Caso 4: Transición a EN_PROCESO (Marcar impresora como ocupada)
    if (data.estado === "EN_PROCESO") {
      const impId = data.impresoraId ? Number(data.impresoraId) : trabajoActual.impresoraId;
      if (impId) {
        await prisma.impresora.update({
          where: { id: impId },
          data: { estado: "IMPRIMIENDO" },
        }).catch(() => {});
      }
    }

    // Actualización genérica
    const updatePayload: any = {};
    if (data.estado) updatePayload.estado = data.estado;
    if (data.prioridad) updatePayload.prioridad = data.prioridad;
    if (data.cantidad !== undefined) updatePayload.cantidad = Number(data.cantidad);
    if (data.tipo_destino) updatePayload.tipo_destino = data.tipo_destino;
    if (data.estado_venta) updatePayload.estado_venta = data.estado_venta;
    if (data.unidades_en_stock !== undefined) updatePayload.unidades_en_stock = Number(data.unidades_en_stock);
    if (data.unidades_vendidas !== undefined) updatePayload.unidades_vendidas = Number(data.unidades_vendidas);
    if (data.desperdicio_gramos !== undefined) updatePayload.desperdicio_gramos = Number(data.desperdicio_gramos);
    if (data.motivo_fallo !== undefined) updatePayload.motivo_fallo = data.motivo_fallo;
    if (data.progreso_porcentaje !== undefined) updatePayload.progreso_porcentaje = Number(data.progreso_porcentaje);
    if (data.impresoraId !== undefined) updatePayload.impresoraId = data.impresoraId ? Number(data.impresoraId) : null;
    if (data.impresora_asignada !== undefined) updatePayload.impresora_asignada = data.impresora_asignada;
    if (data.tiempo_minutos !== undefined) updatePayload.tiempo_minutos = Number(data.tiempo_minutos);
    if (data.precio_venta !== undefined) updatePayload.precio_venta = Number(data.precio_venta);

    const actualizado = await prisma.trabajoProduccion.update({
      where: { id: jobId },
      data: updatePayload,
      include: {
        impresora: true,
        materiales_ams: { include: { bobina: true } },
      },
    });

    return NextResponse.json({ success: true, data: actualizado });
  } catch (error: any) {
    console.error("Error updating job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const jobId = Number(id);
    const trabajo = await prisma.trabajoProduccion.findUnique({ where: { id: jobId } });

    await prisma.trabajoProduccion.delete({
      where: { id: jobId },
    });

    // Si la impresora estaba en ese trabajo, verificar si tiene más trabajos activos
    if (trabajo?.impresoraId) {
      const otrosTrabajos = await prisma.trabajoProduccion.count({
        where: {
          impresoraId: trabajo.impresoraId,
          estado: "EN_PROCESO",
        },
      });
      if (otrosTrabajos === 0) {
        await prisma.impresora.update({
          where: { id: trabajo.impresoraId },
          data: { estado: "DISPONIBLE" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
