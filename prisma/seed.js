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
      tasa_fallo_default: 5.0,
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

  // 3. Impresoras
  let impresoras = await prisma.impresora.findMany();
  if (impresoras.length === 0) {
    await prisma.impresora.createMany({
      data: [
        {
          nombre: "Bambu Lab P1S (AMS 1)",
          modelo: "P1S + AMS Combo",
          consumo_kw: 0.28,
          costo_maquina: 950.0,
          horas_vida_util: 8000,
          horas_uso_actual: 420.0,
          estado: "IMPRIMIENDO",
        },
        {
          nombre: "Bambu Lab X1-Carbon (AMS 2)",
          modelo: "X1-Carbon Combo",
          consumo_kw: 0.35,
          costo_maquina: 1500.0,
          horas_vida_util: 10000,
          horas_uso_actual: 680.0,
          estado: "IMPRIMIENDO",
        },
        {
          nombre: "Bambu Lab A1 Mini",
          modelo: "A1 Mini Bed Slinger",
          consumo_kw: 0.15,
          costo_maquina: 400.0,
          horas_vida_util: 6000,
          horas_uso_actual: 150.0,
          estado: "DISPONIBLE",
        },
      ],
    });
    impresoras = await prisma.impresora.findMany();
    console.log("Impresoras cargadas (3)");
  }

  // 4. Bobinas
  let bobinas = await prisma.bobinaFilamento.findMany();
  if (bobinas.length === 0) {
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
          estado: "EN_USO",
          ubicacion_slot_ams: "AMS 1 - Slot 1",
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
          estado: "EN_USO",
          ubicacion_slot_ams: "AMS 1 - Slot 2",
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
          estado: "EN_USO",
          ubicacion_slot_ams: "AMS 2 - Slot 1",
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
          estado: "EN_USO",
          ubicacion_slot_ams: "AMS 2 - Slot 2",
        },
      ],
    });
    bobinas = await prisma.bobinaFilamento.findMany();
    console.log("Bobinas iniciales cargadas (4)");
  }

  // 5. Clientes
  let clientes = await prisma.cliente.findMany();
  if (clientes.length === 0) {
    await prisma.cliente.createMany({
      data: [
        { nombre: "Estudio Alfa", telefono: "+54 261 4455667", email: "contacto@estudioalfa.com", empresa: "Estudio Alfa Arq" },
        { nombre: "Mendoza Tech", telefono: "+54 261 5566778", email: "compras@mendozatech.com", empresa: "Mendoza Tech SRL" },
        { nombre: "Lucas Gómez", telefono: "+54 261 6677889", email: "lucasgomez@gmail.com", empresa: "Particular" },
        { nombre: "Deco Hogar", telefono: "+54 261 7788990", email: "pedidos@decohogar.com", empresa: "Deco Hogar Cuyo" },
      ],
    });
    clientes = await prisma.cliente.findMany();
    console.log("Clientes iniciales cargados (4)");
  }

  // 6. Trabajos
  const countTrabajos = await prisma.trabajoProduccion.count();
  if (countTrabajos === 0) {
    const p1s = impresoras.find(p => p.nombre.includes("P1S")) || impresoras[0];
    const x1c = impresoras.find(p => p.nombre.includes("X1")) || impresoras[1];
    const a1 = impresoras.find(p => p.nombre.includes("A1")) || impresoras[2];

    const t1 = await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: "TRB-101",
        nombre_archivo: "organizador_cables_v2.3mf",
        cliente: "Estudio Alfa",
        impresoraId: p1s ? p1s.id : null,
        impresora_asignada: p1s ? p1s.nombre : "Bambu Lab P1S",
        material: "PLA+",
        color: "Negro Mate",
        color_hex: "#1e293b",
        estado: "EN_PROCESO",
        prioridad: "ALTA",
        tiempo_minutos: 180,
        tiempo_operador_min: 15,
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
        materiales_ams: {
          create: [
            {
              bobinaId: bobinas[0]?.id,
              slot_ams: 1,
              color_nombre: "Negro Mate",
              color_hex: "#1e293b",
              gramos_usados: 145,
              costo_calculado: 3.48,
            }
          ]
        }
      },
    });

    const t2 = await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: "TRB-102",
        nombre_archivo: "llaveros_corporativos_x50.3mf",
        cliente: "Mendoza Tech",
        impresoraId: x1c ? x1c.id : null,
        impresora_asignada: x1c ? x1c.nombre : "Bambu Lab X1-Carbon",
        material: "PETG Basic",
        color: "Blanco Nieve",
        color_hex: "#f8fafc",
        estado: "EN_PROCESO",
        prioridad: "MEDIA",
        tiempo_minutos: 240,
        tiempo_operador_min: 20,
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
        materiales_ams: {
          create: [
            {
              bobinaId: bobinas[1]?.id,
              slot_ams: 2,
              color_nombre: "Blanco Nieve",
              color_hex: "#f8fafc",
              gramos_usados: 310,
              costo_calculado: 8.68,
            }
          ]
        }
      },
    });

    await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: "TRB-103",
        nombre_archivo: "soporte_auriculares_gamer.3mf",
        cliente: "Lucas Gómez",
        impresoraId: null,
        impresora_asignada: null,
        material: "PLA+",
        color: "Negro Mate",
        color_hex: "#1e293b",
        estado: "EN_ESPERA",
        prioridad: "MEDIA",
        tiempo_minutos: 195,
        tiempo_operador_min: 15,
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
    });

    await prisma.trabajoProduccion.create({
      data: {
        codigo_orden: "TRB-098",
        nombre_archivo: "caja_baterias_18650.3mf",
        cliente: "Taller Solar",
        impresoraId: p1s ? p1s.id : null,
        impresora_asignada: p1s ? p1s.nombre : "Bambu Lab P1S",
        material: "PETG Basic",
        color: "Blanco Nieve",
        color_hex: "#f8fafc",
        estado: "COMPLETADO",
        prioridad: "MEDIA",
        tiempo_minutos: 90,
        tiempo_operador_min: 10,
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
    });

    console.log("Trabajos iniciales con relaciones cargados");
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

