# Diseño de Infraestructura para Producción
 
**Grupo:** 7  
**Actividad:** TP Integrador - Actividad 4, Fase 2
 
---

### Dashboard RED en Grafana

* **Propósito:** Visualizar en tiempo real el estado de salud y el rendimiento de la API basándose en el método RED. Es necesario para detectar anomalías de red, picos de tráfico y cuellos de botella de forma proactiva, asegurando una buena experiencia de usuario.
* **Estructura:** Un dashboard centralizado en la interfaz de Grafana compuesto por 6 paneles independientes. Cada panel ejecuta una consulta PromQL (`rate`, `histogram_quantile`, `topk`) contra la base de datos de Prometheus.
* **Requisitos no funcionales:** Lectura clara e intuitiva de los datos, actualización en tiempo real (o latencia mínima) y consultas eficientes para no sobrecargar el servidor de observabilidad.

Diseñen un dashboard con al menos 6 paneles:

| Panel | Métrica | Tipo de gráfico | Propósito |
| :--- | :--- | :--- | :--- |
| 1. Requests por segundo | `rate(http.server.duration.count[1m])` | Time series | Medir el volumen de tráfico (Rate) y la carga transaccional que recibe la API. |
| 2. Tasa de error | `rate(...{status=~"5.."}[1m]) / rate(...[1m])` | Time series | Detectar el porcentaje de fallos del servidor (Errors) para disparar alertas de fiabilidad. |
| 3. Latencia p95/p99 | `histogram_quantile(0.95, ...)` | Time series | Monitorear el tiempo de respuesta (Duration) garantizando la experiencia del 95% de los usuarios. |
| 4. Por status code | `sum by(status) (rate(...))` | Stacked area | Clasificar las respuestas HTTP para identificar anomalías de red o ruteo. |
| 5. Memoria del proceso | `process.memory.usage` | Time series | Controlar el consumo de RAM del contenedor Node.js para prevenir caídas por Out Of Memory. |
| 6. Endpoints más lentos | `topk(5, ...)` | Bar chart (horizontal) | Aislar las 5 rutas con peor rendimiento para futuras optimizaciones de código. |
