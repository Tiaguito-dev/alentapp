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

try {
    sdk.start();
} catch (error) {
    console.error('Error al iniciar OpenTelemetry SDK:', error);
}

// Meter: objeto que nos provee OTel para crear instrumentos de medición
const meter = metrics.getMeter('alentapp-api');

meter.createObservableGauge('process.memory.usage', {
    description: 'Memoria heap usada por el proceso Node.js',
    unit: 'bytes',
}).addCallback((result) => {
    result.observe(process.memoryUsage().heapUsed);
});

export const activeRequestsGauge = meter.createUpDownCounter('http.requests.active', {
    description: 'Requests HTTP siendo procesadas actualmente',
});

export const requestCounter = meter.createCounter('http.requests.total', {
    description: 'Total de requests HTTP',
});

export const errorCounter = meter.createCounter('http.requests.errors', {
    description: 'Total de errores HTTP',
});

export const requestDuration = meter.createHistogram('http.request.duration', {
    description: 'Duración de requests HTTP',
    unit: 'ms',
});

export async function shutdownTelemetry() {
    await sdk.shutdown();
}