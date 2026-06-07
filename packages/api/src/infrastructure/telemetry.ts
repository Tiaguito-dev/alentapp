import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { metrics } from '@opentelemetry/api';

// Expone las métricas en http://localhost:9464/metrics para que Prometheus haga scraping
const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
});

// Inicializa el SDK con auto-instrumentaciones para HTTP
const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        new HttpInstrumentation(),
        new FastifyInstrumentation(),
    ],
});

sdk.start();

// Meter: objeto que nos provee OTel para crear instrumentos de medición
const meter = metrics.getMeter('alentapp-api');

// Gauge observable: OTel llama al callback automáticamente cada vez que
// Prometheus hace scraping, leyendo la memoria heap actual del proceso
meter.createObservableGauge('process.memory.usage', {
    description: 'Memoria heap usada por el proceso Node.js',
    unit: 'bytes',
}).addCallback((result) => {
    result.observe(process.memoryUsage().heapUsed);
});

// UpDownCounter: se exporta para usarlo en los hooks globales de app.ts
// Se usa UpDownCounter porque necesitamos incrementar (+1) y decrementar (-1)
// su valor al inicio y fin de cada request
export const activeRequestsGauge = meter.createUpDownCounter('http.requests.active', {
    description: 'Requests HTTP siendo procesadas actualmente',
});