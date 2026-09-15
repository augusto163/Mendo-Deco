const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos iniciales en Supabase...");

  // 1. Configuracion
  const config = await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      costo_kwh: 120.0,
      costo_hora_operador: 2500.0,
      margen_ganancia_default: 40.0,
      inversion_inicial: 3226.0,
    },
  });
  console.log("Configuracion inicial lista:", config.id);

  // 2. Activos Inversion
  const countActivos = await prisma.activoInversion.count();
  if (countActivos === 0) {
    await prisma.activoInversion.createMany({
      data: [
        { nombre: "Bambu Lab P1S + AMS", categoria: "Maquinaria", costo: 950.0 },
        { nombre: "Bambu Lab X1-Carbon + AMS", categoria: "Maquinaria", costo: 1500.0 },
        { nombre: "Bambu Lab A1 Mini", categoria: "Maquinaria", costo: 400.0 },
        { nombre: "Placas PEI Texturadas (x3)", categoria: "Herramientas", costo: 90.0 },
        { nombre: "Boquillas Acero Endurecido", categoria: "Herramientas", costo: 45.0 },
        { nombre: "Secador de Filamento Sunlu S2", categoria: "Herramientas", costo: 65.0 },
        { nombre: "Mesa reforzada y setup taller", categoria: "Herramientas", costo: 80.0 },
        { nombre: "Lote inicial filamentos (4 bobinas)", categoria: "Insumos", costo: 96.0 },
      ],
    });
    console.log("Activos de inversion cargados (8)");
  }

  // 3. Bobinas
  const countBobinas = await prisma.bobinaFilamento.count();
  if (countBobinas === 0) {
    await prisma.bobinaFilamento.createMany({
      data: [
        {
          marca: "eSun",
          material: "PLA+",
          color_nombre: "Negro Mate",
          color_hex: "#1e293b",
          peso_inicial_g: 1000,
          peso_actual_g: 850,
          costo_kg: 24.0,
          costo_gramo: 0.024,
        },
        {
          marca: "Bambu Lab",
          material: "PETG Basic",
          color_nombre: "Blanco Nieve",
          color_hex: "#f8fafc",
          peso_inicial_g: 1000,
          peso_actual_g: 420,
          costo_kg: 28.0,
          costo_gramo: 0.028,
        },
        {
          marca: "Polymaker",
          material: "PolyTerra PLA",
          color_nombre: "Verde Bambú",
          color_hex: "#00ae42",
          peso_inicial_g: 1000,
          peso_actual_g: 950,
          costo_kg: 26.0,
          costo_gramo: 0.026,
        },
        {
          marca: "GST3D",
          material: "PLA",
          color_nombre: "Gris Espacial",
          color_hex: "#64748b",
          peso_inicial_g: 1000,
          peso_actual_g: 150,
          costo_kg: 18.0,
          costo_gramo: 0.018,
        },
      ],
    });
    console.log("Bobinas iniciales cargadas (4)");
  }

  // 4. Trabajos
  const countTrabajos = await prisma.trabajoProduccion.count();
  if (countTrabajos === 0) {
    await prisma.trabajoProduccion.createMany({
      data: [
        {
          codigo_orden: "TRB-101",
          nombre_archivo: "organizador_cables_v2.3mf",
          cliente: "Estudio Alfa",
          material: "PLA+",
          color: "Negro Mate",
          color_hex: "#1e293b",
          impresora_asignada: "Bambu Lab P1S",
          estado: "EN_PROCESO",
          prioridad: "ALTA",
          tiempo_minutos: 180,
          gramos_filamento: 145,
          costo_energia: 1.25,
          costo_operador: 4.5,
          costo_filamento: 3.48,
          costo_amortizacion: 1.8,
          costo_total: 11.03,
          precio_venta: 24.5,
          ganancia_neta: 13.47,
          margen_porcentaje: 55,
          progreso_porcentaje: 70,
        },
        {
          codigo_orden: "TRB-102",
          nombre_archivo: "llaveros_corporativos_x50.3mf",
          cliente: "Mendoza Tech",
          material: "PETG Basic",
          color: "Blanco Nieve",
          color_hex: "#f8fafc",
          impresora_asignada: "Bambu Lab X1-Carbon",
          estado: "EN_PROCESO",
          prioridad: "MEDIA",
          tiempo_minutos: 240,
          gramos_filamento: 310,
          costo_energia: 1.8,
          costo_operador: 6.0,
          costo_filamento: 8.68,
          costo_amortizacion: 2.4,
          costo_total: 18.88,
          precio_venta: 45.0,
          ganancia_neta: 26.12,
          margen_porcentaje: 58,
          progreso_porcentaje: 45,
        },
        {
          codigo_orden: "TRB-103",
          nombre_archivo: "soporte_auriculares_gamer.3mf",
          cliente: "Lucas Gómez",
          material: "PLA+",
          color: "Negro Mate",
          color_hex: "#1e293b",
          impresora_asignada: null,
          estado: "EN_ESPERA",
          prioridad: "MEDIA",
          tiempo_minutos: 195,
          gramos_filamento: 180,
          costo_energia: 1.45,
          costo_operador: 5.0,
          costo_filamento: 4.32,
          costo_amortizacion: 1.95,
          costo_total: 12.72,
          precio_venta: 28.0,
          ganancia_neta: 15.28,
          margen_porcentaje: 54.5,
          progreso_porcentaje: 0,
        },
        {
          codigo_orden: "TRB-104",
          nombre_archivo: "maceta_geometrica_nordica.3mf",
          cliente: "Deco Hogar",
          material: "PolyTerra PLA",
          color: "Verde Bambú",
          color_hex: "#00ae42",
          impresora_asignada: null,
          estado: "EN_ESPERA",
          prioridad: "BAJA",
          tiempo_minutos: 320,
          gramos_filamento: 260,
          costo_energia: 2.2,
          costo_operador: 8.0,
          costo_filamento: 6.24,
          costo_amortizacion: 3.2,
          costo_total: 19.64,
          precio_venta: 42.0,
          ganancia_neta: 22.36,
          margen_porcentaje: 53.2,
          progreso_porcentaje: 0,
        },
        {
          codigo_orden: "TRB-098",
          nombre_archivo: "caja_baterias_18650.3mf",
          cliente: "Taller Solar",
          material: "PETG Basic",
          color: "Blanco Nieve",
          color_hex: "#f8fafc",
          impresora_asignada: "Bambu Lab P1S",
          estado: "COMPLETADO",
          prioridad: "MEDIA",
          tiempo_minutos: 90,
          gramos_filamento: 75,
          costo_energia: 0.65,
          costo_operador: 2.5,
          costo_filamento: 1.8,
          costo_amortizacion: 0.9,
          costo_total: 5.85,
          precio_venta: 14.5,
          ganancia_neta: 8.65,
          margen_porcentaje: 59.6,
          progreso_porcentaje: 100,
          fecha_completado: new Date(),
        },
        {
          codigo_orden: "TRB-099",
          nombre_archivo: "engranaje_reductor_petg.3mf",
          cliente: "Ing. Ruiz",
          material: "PLA+",
          color: "Negro Mate",
          color_hex: "#1e293b",
          impresora_asignada: "Bambu Lab X1-Carbon",
          estado: "COMPLETADO",
          prioridad: "ALTA",
          tiempo_minutos: 150,
          gramos_filamento: 110,
          costo_energia: 1.1,
          costo_operador: 4.0,
          costo_filamento: 3.08,
          costo_amortizacion: 1.5,
          costo_total: 9.68,
          precio_venta: 22.0,
          ganancia_neta: 12.32,
          margen_porcentaje: 56.0,
          progreso_porcentaje: 100,
          fecha_completado: new Date(),
        },
        {
          codigo_orden: "TRB-100",
          nombre_archivo: "litofania_familiar_curva.3mf",
          cliente: "Sofía Martínez",
          material: "PolyTerra PLA",
          color: "Verde Bambú",
          color_hex: "#00ae42",
          impresora_asignada: "Bambu Lab A1 Mini",
          estado: "COMPLETADO",
          prioridad: "ALTA",
          tiempo_minutos: 210,
          gramos_filamento: 95,
          costo_energia: 1.4,
          costo_operador: 5.5,
          costo_filamento: 2.66,
          costo_amortizacion: 2.1,
          costo_total: 11.66,
          precio_venta: 28.0,
          ganancia_neta: 16.34,
          margen_porcentaje: 58.3,
          progreso_porcentaje: 100,
          fecha_completado: new Date(),
        },
      ],
    });
    console.log("Trabajos iniciales cargados (7)");
  }

  console.log("¡Carga inicial completada exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error al poblar base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
