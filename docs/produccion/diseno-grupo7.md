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
| `http.server.duration` | Histogram | Latencia de cada request HTTP. A partir de este histogram se derivan Rate (cantidad de requests por segundo), Errors (requests con status 4xx/5xx) y Duration (latencia p95/p99). | `http.request.method`, `http.route`, `http.response.status_code` |
 
Esta única métrica es suficiente para alimentar los paneles de Rate, Errors y Duration
del dashboard RED, ya que Prometheus permite derivar las tres a partir del histogram
usando PromQL.
 
#### Métricas manuales adicionales
 
Estas dos métricas no las captura la auto-instrumentación y deben definirse manualmente:
 
| Métrica | Tipo | Descripción | Labels | Dónde se registra |
|---------|------|-------------|--------|-------------------|
| `process.memory.usage` | Gauge | Memoria heap usada por el proceso Node.js en bytes. Se mide de forma periódica con `process.memoryUsage().heapUsed`. | — | `telemetry.ts` (observable, no en controllers) |
| `http.requests.active` | Gauge | Cantidad de requests siendo procesadas en este momento. Se incrementa al inicio de cada handler y se decrementa al finalizar. | `route` | Cada controller |
 
---