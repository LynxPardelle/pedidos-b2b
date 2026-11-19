# Pedidos B2B

Recibir pedidos recurrentes de compradores empresariales con precios autorizados por cuenta, importes exactos y seguimiento de surtido.

Producto nuevo de ZooBeriah Systems inspirado en el dominio de [TiendaDigital](https://github.com/LynxPardelle/TiendaDigital). La base se escribió de forma independiente: no incluye código, marca, contenido ni datos del proyecto de referencia.

## Alcance de esta preparación

- Frontend Angular 22.3 con componentes standalone y NgRx SignalStore.
- Endpoint serverless `GET /api/health`; infraestructura SAM con Lambda Node.js 24 ARM64, HTTP API y almacenamiento DynamoDB bajo demanda.
- Modelo de dominio puro con seis pruebas de reglas. `services/domain/order.mjs` ofrece `prepareOrder` y `acceptIdempotentOrder`: calcula unidades monetarias enteras, valida cantidades y duplicados, controla organización/comprador y detecta reintentos. Los precios deben venir de un catálogo autorizado del servidor. El registro de idempotencia devuelto aún no se persiste.
- Plan por fases para conectar identidad, persistencia, interfaz y piloto. El flujo comercial todavía no está disponible de extremo a extremo.

## Arranque y comprobación

Desde la raíz, usar los scripts de `package.json` para preparar y arrancar la base. Comandos directos de comprobación:

```powershell
node --test services/domain/order.test.mjs
npm --prefix web ci
npm --prefix web run build
```

La consola Angular de preparación consulta el health mediante el proxy local. Las pruebas de dominio no necesitan AWS ni credenciales. El comando de servidor local y el resto de las verificaciones están definidos en los scripts de la raíz.

## Documentación

- [Producto](docs/PRODUCTO.md): comprador, flujo, límites y validación comercial.
- [Arquitectura](docs/architecture/ARCHITECTURE.md) y [diagrama](docs/architecture/diagram.mmd).
- [Plan ejecutable](plan/architecture-foundation-1.md): el primer trabajo pendiente es `TASK-002`: identidad y acceso por comprador/empresa antes de aceptar pedidos desde HTTP.
- [Operación](docs/operacion.md): ambientes, despliegue futuro, verificación y reversión.
- [Procedencia](docs/PROVENANCE.md): separación del proyecto original.

## Ambientes

| Ambiente | Rama | Stack |
|---|---|---|
| development | development | pedidos-b2b-development |
| testing | testing | pedidos-b2b-testing |
| production | main | pedidos-b2b-production |

Los cambios siguen `development → testing → main` mediante PR. Las plantillas y configuración están preparadas; crear el repositorio y sus ambientes no equivale a desplegar recursos de AWS.


## Base compartida y operación local

Ver [base local](docs/BASE-LOCAL.md) y [promoción](docs/promocion.md). Instalar con npm --prefix web ci; validar con npm test, npm run check:config, npm run test:web y npm run build:web. Para el recorrido local abrir dos terminales: npm run dev:api y npm run dev:web. Los resultados de preparación quedarán en [verificación](docs/VERIFICACION.md).
