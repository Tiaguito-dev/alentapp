# Diseño de Infraestructura para Producción
 
**Grupo:** 7  
**Actividad:** TP Integrador - Actividad 4, Fase 2
 
---

## 2.2. Diseño de la observabilidad
 
### Métricas RED a capturar
 
Las métricas RED se obtienen de dos fuentes: la auto-instrumentación del SDK de OTel
y dos métricas manuales adicionales que la auto-instrumentación no captura.
 
#### Métricas automáticas
 
La auto-instrumentación de OTel genera automáticamente la siguiente métrica al
configurar `@opentelemetry/instrumentation-http` y `@opentelemetry/instrumentation-fastify`:
 
| Métrica | Tipo | Descripción | Labels |
|---------|------|-------------|--------|
| `http.server.duration` (Rate) | Counter | Requests por segundo que recibe el servicio. Se deriva con `rate(http_server_duration_count[1m])`. | `method`, `route`, `status` |
| `http.server.duration` (Errors) | Counter | Tasa de requests que resultaron en error 4xx/5xx. Se deriva filtrando por status con `rate(http_server_duration_count{status=~"5.."}[1m])`. | `method`, `route`, `status` |
| `http.server.duration` (Duration) | Histogram | Latencia de cada request. Se deriva con `histogram_quantile(0.95, ...)` para obtener p95/p99. | `method`, `route` |
 
Las tres métricas RED se generan automáticamente a partir del mismo histogram
`http.server.duration` al configurar las auto-instrumentaciones de HTTP y Fastify.
Prometheus permite derivar Rate, Errors y Duration usando PromQL sin necesidad de
definir métricas manuales adicionales para estas tres.
 
#### Métricas manuales adicionales
 
Estas dos métricas no las captura la auto-instrumentación y deben definirse manualmente:
 
| Métrica | Tipo | Descripción | Labels | Dónde se registra |
|---------|------|-------------|--------|-------------------|
| `process.memory.usage` | Gauge | Memoria heap usada por el proceso Node.js en bytes. Se mide de forma periódica con `process.memoryUsage().heapUsed`. | — | `telemetry.ts` (observable, no en controllers) |
| `http.requests.active` | Gauge | Cantidad de requests siendo procesadas en este momento. Se incrementa al inicio de cada handler y se decrementa al finalizar. | `route` | Cada controller |

#### Aclaración

"Gauge" es un tipo de métrica que representa un valor que puede subir y bajar libremente, como un termómetro. Por ejemplo, la memoria usada puede ser 200MB ahora, 350MB en 5 minutos, y 180MB después. Se diferencia del Counter, que solo puede subir.
 
---

### OpenTelemetry SDK

El OTel SDK es un kit de desarrollo de software (librería) que nos va a permitir instrumentar
y exportar las métricas que querramos obtener de nuestra app hacia el backend de destino que configuremos (en nuestro caso, Prometheus). 
 
El SDK se configura en un único archivo de inicialización que debe ser importado
**antes que cualquier otro módulo** en el entrypoint de la API.
 
#### Estructura de archivos
 
```
packages/api/src/
├── app.ts                          ← importa telemetry.ts como primer import
└── infrastructure/
    └── telemetry.ts                ← inicialización del SDK y métricas manuales
```
 
#### `packages/api/src/infrastructure/telemetry.ts`
 
Responsabilidades:
- Configurar el `PrometheusExporter` en el puerto `9464`, endpoint `/metrics`
- Inicializar el `NodeSDK` con las auto-instrumentaciones para HTTP y Fastify
- Definir el Gauge `process.memory.usage` con un observable callback
- Exportar el Gauge `http.requests.active` para uso en los controllers

`PrometheusExporter` es el componente que traduce las métricas internas de OTel al formato que Prometheus entiende, y las expone en un endpoint HTTP para que Prometheus pueda hacer scraping.

`NodeSDK` es la clase principal del SDK de OTel para Node.js. Cuando la instanciamos y llamamos a sdk.start(), arranca todo el sistema de observabilidad: activa las auto-instrumentaciones, conecta el exporter y empieza a recolectar métricas.

Diseño conceptual:
 
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';
 
// 1. Configurar el exporter: expone las métricas en :9464/metrics
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});
 
// 2. Inicializar el SDK con auto-instrumentaciones para HTTP y Fastify
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {},
      '@opentelemetry/instrumentation-fastify': {},
    }),
  ],
});
 
sdk.start();
 
// 3. Obtener el meter para métricas manuales
// meter es el objeto que nos da OTel para crear instrumentos de medición (como, por ejemplo, counters, gauges, histogramas), es decir, objetos para medir cosas específicas
const meter = metrics.getMeter('alentapp-api');
 
// 4. Gauge: memoria del proceso (observable, se mide automáticamente).  
meter.createObservableGauge('process.memory.usage', {
  description: 'Memoria heap usada por el proceso Node.js',
  unit: 'bytes',
}).addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed);
});
 
// 5. Gauge: requests activas (se exporta para usar en los controllers)
export const activeRequestsGauge = meter.createUpDownCounter('http.requests.active', {
  description: 'Requests HTTP siendo procesadas actualmente',
});
```

> Se usa `UpDownCounter` en lugar de `Gauge` para `http.requests.active` porque
> necesitamos incrementar (+1) y decrementar (-1) su valor desde los controllers.
> Un `Gauge` estándar solo permite observar un valor en un momento dado.
 
#### Uso en los controllers
 
En cada controller se importa `activeRequestsGauge` y se registra el inicio y fin
de cada request:
 
```typescript
import { activeRequestsGauge } from '../infrastructure/telemetry.js';
 
async handler(request, reply) {
  const route = request.routeOptions.url;
  activeRequestsGauge.add(1, { route });
 
  try {
    // lógica del handler
  } finally {
    activeRequestsGauge.add(-1, { route });
  }
}
```
 
#### `packages/api/src/app.ts`
 
El import de `telemetry.ts` debe ser el primero del archivo para garantizar que
el SDK esté inicializado antes de que Fastify y cualquier otro módulo carguen:
 
```typescript
// PRIMERO: inicializar OTel antes de cualquier otro import
import './infrastructure/telemetry.js';
 
// Luego el resto de imports
import Fastify from 'fastify';
// ...
```
 
#### Requisitos no funcionales
 
| Requisito | Valor |
|-----------|-------|
| Puerto del exporter | `9464` |
| Endpoint de métricas | `/metrics` |
| Tiempo de inicio del SDK | Debe completarse antes del primer request | //se garantiza importando telemetry.ts como primer import en app.ts.
| Impacto en latencia | Menor a 5ms por request (overhead de instrumentación) | //el sistema de observabilidad no debe degradar la performance de la API.