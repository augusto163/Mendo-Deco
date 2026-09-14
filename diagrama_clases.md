# Modelo de Dominio y Diagrama de Clases - Granja de Impresión 3D

Este directorio contiene la arquitectura y el diagrama de clases para el sistema de gestión de la granja de impresión 3D (adaptado a los datos y flujos de **Bambu Studio**).

---

## Archivos Generados para Descarga y Uso

| Archivo | Descripción | Uso |
| :--- | :--- | :--- |
| [`diagrama_clases.html`](file:///c:/Users/augus/Desktop/MendoDeco/diagrama_clases.html) | **Visor interactivo en el navegador** | Haz doble clic para abrir en Chrome/Edge. Incluye botones directos para **Descargar en SVG**, **Descargar en PNG** e **Imprimir / Guardar como PDF**. |
| [`diagrama_clases.mmd`](file:///c:/Users/augus/Desktop/MendoDeco/diagrama_clases.mmd) | **Código fuente Mermaid** | Ideal para importar en [Mermaid Live Editor](https://mermaid.live), Notion, Obsidian, GitHub o Draw.io. |

---

## Diagrama de Clases

```mermaid
classDiagram
    direction TB

    %% Enums para tipado seguro
    class EstadoPedido {
        <<enumeration>>
        EN_COLA
        EN_PROCESO
        TERMINADO
        ENTREGADO
        CANCELADO
    }

    class EstadoTrabajo {
        <<enumeration>>
        PENDIENTE
        IMPRIMIENDO
        COMPLETADO
        FALLIDO
        CANCELADO
    }

    class EstadoImpresora {
        <<enumeration>>
        ACTIVA
        IMPRIMIENDO
        MANTENIMIENTO
        INACTIVA
    }

    class EstadoBobina {
        <<enumeration>>
        NUEVA
        EN_USO
        AGOTADA
        DESCARTADA
    }

    %% Clases del Dominio
    class Cliente {
        +int id
        +String nombre
        +String telefono
        +String email
        +Date fechaRegistro
        +String notas
        +crearPedido(titulo: String, fechaEntrega: Date) Pedido
        +obtenerHistorialPedidos() List~Pedido~
    }

    class Pedido {
        +int id
        +String titulo
        +EstadoPedido estadoGeneral
        +Date fechaCreacion
        +Date fechaEntregaEsperada
        +float precioTotalCobrado
        +float costoTotalCalculado
        +agregarTrabajo(trabajo: TrabajoImpresion) void
        +calcularCostoTotal() float
        +calcularPrecioSugerido(margen: float) float
        +actualizarEstado() void
    }

    class Impresora {
        +int id
        +String nombre
        +float consumoKw
        +float costoMaquina
        +int horasVidaUtil
        +EstadoImpresora estado
        +getCostoAmortizacionPorHora() float
        +estaDisponible() bool
        +registrarFinTrabajo() void
    }

    class Bobina {
        +int id
        +String marca
        +String material
        +String color
        +float pesoInicialG
        +float pesoActualG
        +float costoCompra
        +EstadoBobina estado
        +getCostoPorGramo() float
        +descontarStock(gramos: float) bool
        +tieneStockSuficiente(gramos: float) bool
    }

    class TrabajoImpresion {
        +int id
        +String nombreArchivo
        +EstadoTrabajo estado
        +int tiempoImpresionMinutos
        +int tiempoOperadorMinutos
        +float costoElectricidad
        +float costoAmortizacion
        +float costoManoObra
        +calcularCostoElectricidad(costoKwh: float) float
        +calcularAmortizacion() float
        +calcularCostoManoObra(costoHoraOp: float) float
        +calcularCostoTotal(config: ConfiguracionCostos) float
        +procesarConsumoMaterial() void
    }

    class UsoMaterial {
        +int id
        +float gramosUsados
        +float costoMaterialCalculado
        +calcularCosto() float
    }

    class ConfiguracionCostos {
        +int id
        +float costoKwh
        +float costoHoraOperador
        +float margenGananciaDefault
        +float tasaFallaEstimada
        +aplicarFactorFalla(costoBase: float) float
    }

    %% Relaciones y Cardinalidades
    Cliente "1" --> "0..*" Pedido : realiza
    Pedido "1" *-- "1..*" TrabajoImpresion : contiene (piezas)
    Impresora "1" --> "0..*" TrabajoImpresion : ejecuta
    TrabajoImpresion "1" *-- "1..*" UsoMaterial : requiere
    Bobina "1" --> "0..*" UsoMaterial : suministra
    TrabajoImpresion ..> ConfiguracionCostos : consulta costos
```
