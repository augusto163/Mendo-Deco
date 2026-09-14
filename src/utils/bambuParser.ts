import JSZip from "jszip";

export interface BambuFilament {
  id: number;
  type: string;
  color: string;
  usedGrams: number;
  usedMeters: number;
}

export interface BambuPlateInfo {
  index: number;
  name: string;
  predictionSeconds: number;
  printTimeMinutes: number;
  weightGrams: number;
  filamentGrams: number;
  objectNames: string[];
}

export interface BambuSliceMetadata {
  fileName: string;
  printTimeMinutes: number;
  printTimeSeconds: number;
  totalWeightGrams: number;
  plateCount: number;
  plates: BambuPlateInfo[];
  filaments: BambuFilament[];
  isSliced: boolean;
  isSinglePlateExport: boolean;
  singlePlateIndex?: number;
}

/**
 * Lee y parsea un archivo de proyecto o placa .3mf de Bambu Studio / OrcaSlicer.
 * Soporta archivos de placa única (ej: pikachu_p1s_plate_6.gcode.3mf) y proyectos completos
 * con múltiples placas (ej: pikachu_p1s.3mf con 6 placas).
 */
export async function parseBambu3mf(file: File): Promise<BambuSliceMetadata> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("El archivo no es un contenedor .3mf / ZIP válido.");
  }

  // 1. Localizar slice_info.config
  let sliceConfigFile = zip.file("Metadata/slice_info.config");
  if (!sliceConfigFile) {
    const matchedKey = Object.keys(zip.files).find((p) =>
      p.toLowerCase().endsWith("slice_info.config")
    );
    if (matchedKey) sliceConfigFile = zip.file(matchedKey);
  }

  // 2. Si no existe slice_info.config, buscar en G-code embebido
  if (!sliceConfigFile) {
    const gcodeFile = Object.keys(zip.files).find((p) => p.endsWith(".gcode") || p.includes("plate_"));
    if (gcodeFile) {
      const gcodeText = await zip.file(gcodeFile)!.async("text");
      return parseGcodeFallback(file.name, gcodeText);
    }

    throw new Error(
      `El archivo "${file.name}" no contiene datos de laminado.\n\n` +
      `Si lo descargaste de MakerWorld o lo abriste en Bambu Studio:\n` +
      `1. Lamina las placas en Bambu Studio (Laminar todo).\n` +
      `2. Ve a: Archivo > Guardar proyecto (Ctrl + S).\n` +
      `3. Vuelve a subir el archivo.`
    );
  }

  // 3. Parsear XML de slice_info.config
  const xmlContent = await sliceConfigFile.async("text");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  if (xmlDoc.querySelector("parsererror")) {
    throw new Error("Error al analizar la estructura XML interna de slice_info.config.");
  }

  // 4. Iterar sobre TODAS las placas (<plate>)
  const plateElements = xmlDoc.querySelectorAll("plate");
  const parsedPlates: BambuPlateInfo[] = [];
  const filamentMap = new Map<number, BambuFilament>();

  let totalPredictionSeconds = 0;
  let totalWeightSum = 0;

  plateElements.forEach((plateEl) => {
    let plateIndex = 1;
    let platePredictionSeconds = 0;
    let plateWeight = 0;

    // Metadatos de la placa
    plateEl.querySelectorAll("metadata").forEach((meta) => {
      const key = meta.getAttribute("key");
      const val = meta.getAttribute("value");
      if (!key || !val) return;

      if (key === "index") plateIndex = parseInt(val, 10) || 1;
      else if (key === "prediction") platePredictionSeconds = parseFloat(val) || 0;
      else if (key === "weight") plateWeight = parseFloat(val) || 0;
    });

    // Objetos en la placa
    const objectNames: string[] = [];
    plateEl.querySelectorAll("object").forEach((obj) => {
      const name = obj.getAttribute("name");
      if (name) objectNames.push(name);
    });

    // Filamentos consumidos en esta placa
    let plateFilamentSum = 0;
    plateEl.querySelectorAll("filament").forEach((fil) => {
      const id = parseInt(fil.getAttribute("id") || "1", 10);
      const type = fil.getAttribute("type") || "Desconocido";
      const color = fil.getAttribute("color") || "#ffffff";
      const usedGrams = parseFloat(fil.getAttribute("used_g") || "0");
      const usedMeters = parseFloat(fil.getAttribute("used_m") || "0");

      plateFilamentSum += usedGrams;

      // Consolidar en el mapa global de filamentos
      if (filamentMap.has(id)) {
        const existing = filamentMap.get(id)!;
        existing.usedGrams += usedGrams;
        existing.usedMeters += usedMeters;
      } else {
        filamentMap.set(id, {
          id,
          type,
          color,
          usedGrams,
          usedMeters,
        });
      }
    });

    if (plateWeight === 0 && plateFilamentSum > 0) {
      plateWeight = plateFilamentSum;
    }

    totalPredictionSeconds += platePredictionSeconds;
    totalWeightSum += plateWeight;

    parsedPlates.push({
      index: plateIndex,
      name: objectNames.length > 0 ? objectNames.join(", ") : `Placa ${plateIndex}`,
      predictionSeconds: platePredictionSeconds,
      printTimeMinutes: Math.ceil(platePredictionSeconds / 60),
      weightGrams: Math.round(plateWeight * 100) / 100,
      filamentGrams: Math.round(plateFilamentSum * 100) / 100,
      objectNames,
    });
  });

  // Fallback si slice_info.config no tenía <plate>
  if (parsedPlates.length === 0 || (totalPredictionSeconds === 0 && totalWeightSum === 0)) {
    const gcodeFile = Object.keys(zip.files).find((p) => p.endsWith(".gcode") || p.includes("plate_"));
    if (gcodeFile) {
      const gcodeText = await zip.file(gcodeFile)!.async("text");
      return parseGcodeFallback(file.name, gcodeText);
    }

    throw new Error(
      `El archivo "${file.name}" no contiene datos de corte guardados.\n\n` +
      `Si lo tienes abierto en Bambu Studio, recuerda guardar el proyecto (Ctrl + S) para que se guarden los datos de corte en el archivo.`
    );
  }

  // Lista consolidada de filamentos redondeada
  const consolidatedFilaments: BambuFilament[] = Array.from(filamentMap.values()).map((f) => ({
    ...f,
    usedGrams: Math.round(f.usedGrams * 100) / 100,
    usedMeters: Math.round(f.usedMeters * 100) / 100,
  }));

  // Detectar si es una exportación de placa individual (ej: pikachu_p1s_plate_6.gcode.3mf)
  const isSinglePlateExport =
    parsedPlates.length === 1 &&
    (file.name.toLowerCase().includes("plate_") || parsedPlates[0].index > 1);

  return {
    fileName: file.name,
    printTimeMinutes: Math.ceil(totalPredictionSeconds / 60),
    printTimeSeconds: totalPredictionSeconds,
    totalWeightGrams: Math.round(totalWeightSum * 100) / 100,
    plateCount: parsedPlates.length,
    plates: parsedPlates,
    filaments: consolidatedFilaments,
    isSliced: true,
    isSinglePlateExport,
    singlePlateIndex: isSinglePlateExport ? parsedPlates[0].index : undefined,
  };
}

function parseGcodeFallback(fileName: string, gcode: string): BambuSliceMetadata {
  let printTimeSeconds = 0;
  let totalWeightGrams = 0;

  const weightMatch = gcode.match(/total filament used \[g\]\s*=\s*([\d.]+)/i) ||
                      gcode.match(/filament used \[g\]\s*=\s*([\d.]+)/i);
  if (weightMatch && weightMatch[1]) totalWeightGrams = parseFloat(weightMatch[1]);

  const timeMatch = gcode.match(/total estimated time:\s*(\d+)s/i) ||
                    gcode.match(/prediction[^\d]+(\d+)/i);
  if (timeMatch && timeMatch[1]) printTimeSeconds = parseInt(timeMatch[1], 10);

  const isSingle = fileName.toLowerCase().includes("plate_");
  const plateMatch = fileName.match(/plate_(\d+)/i);
  const plateIndex = plateMatch ? parseInt(plateMatch[1], 10) : 1;

  return {
    fileName,
    printTimeMinutes: Math.ceil(printTimeSeconds / 60) || 0,
    printTimeSeconds,
    totalWeightGrams: Math.round(totalWeightGrams * 100) / 100,
    plateCount: 1,
    plates: [
      {
        index: plateIndex,
        name: `Placa ${plateIndex}`,
        predictionSeconds: printTimeSeconds,
        printTimeMinutes: Math.ceil(printTimeSeconds / 60) || 0,
        weightGrams: Math.round(totalWeightGrams * 100) / 100,
        filamentGrams: Math.round(totalWeightGrams * 100) / 100,
        objectNames: [],
      },
    ],
    filaments: [],
    isSliced: printTimeSeconds > 0 || totalWeightGrams > 0,
    isSinglePlateExport: isSingle,
    singlePlateIndex: isSingle ? plateIndex : undefined,
  };
}
