---
goal: Preparar y completar el primer flujo de Pedidos B2B
version: 1
date_created: 2026-11-19
last_updated: 2026-11-19
owner: ZooBeriah Systems
status: In progress
tags: [architecture, angular, serverless, product]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

Recibir pedidos recurrentes de compradores empresariales con precios autorizados por cuenta, importes exactos y seguimiento de surtido. Este plan diferencia la preparación técnica del flujo comercial pendiente.

## 1. Requirements & Constraints

- **REQ-001**: Angular standalone con NgRx SignalStore por flujo.
- **REQ-002**: Backend por dominio en Lambda Node.js 24 y AWS SAM.
- **REQ-003**: Ambientes independientes development, testing y production; ramas development, testing y main.
- **SEC-001**: Validar JWT y resolver membresía antes de exponer una ruta de negocio.
- **SEC-002**: Nunca aceptar del navegador la organización, comprador, precio o permiso como prueba de autoridad.
- **CON-001**: Sólo `GET /api/health` queda expuesto en esta base.
- **CON-002**: No copiar código, contenido ni datos del proyecto TiendaDigital; datos sintéticos en pruebas.
- **PAT-001**: Escritor condicional, versiones esperadas e idempotencia transaccional; mínimo costo en reposo.
- **PAT-002**: Los servicios poseen su almacenamiento. SQS/Step Functions sólo se añaden por un proceso concreto.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Dejar arquitectura, infraestructura base y reglas puras comprobadas.

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-001 | Crear documentos, `infra/template.yaml`, configuración de tres ambientes y `services/domain/order.mjs` con seis pruebas de reglas. El frontend/health y controles compartidos se verifican en la preparación integral. | ✅ | 2026-11-19 |

### Implementation Phase 2

- GOAL-002: Completar identidad y el primer comando persistente. Depende de TASK-001.

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-002 | Crear `services/shared/identity.mjs` y autorizador JWT de API Gateway/Cognito. Resolver organización, comprador y cuenta comercial desde membresías activas del `sub`. Roles iniciales `seller` y `buyer`. Aceptación: Token ausente, comprador de otra cuenta y cruce entre organizaciones reciben denegación; health continúa público. | | |
| TASK-003 | Crear `services/catalog/` con su tabla propia. Resolver del lado servidor SKU, disponibilidad comercial, lista de precios de la cuenta, moneda y versión del catálogo. El cliente sólo envía SKU y cantidad; el servidor fija el precio. Aceptación: Modificar un precio en la petición no modifica el total; un comprador no ve un catálogo ajeno; una versión desactualizada exige confirmar el precio nuevo. | | |
| TASK-004 | Crear `services/orders/repository.mjs` y `services/orders/handler.mjs`. Persistir pedido y registro de idempotencia en la misma transacción condicional. La clave se acota a organización y comprador; guardar el hash del pedido autorizado y devolver 409 al reutilizarla con otro contenido. Aceptación: Veinte solicitudes concurrentes con la misma clave producen un pedido y una respuesta repetible; claves de distintos compradores no colisionan; ningún total usa flotantes. | | |

### Implementation Phase 3

- GOAL-003: Completar el flujo y comprobarlo en ambientes inferiores. Depende de los tres trabajos anteriores.

| Task | Description | Completed | Date |
|---|---|---|---|
| TASK-005 | Crear `web/src/app/features/orders/` con SignalStore por ruta: catálogo, preparación, confirmación y estado. Repetir pedido debe crear un borrador nuevo y resolver precios actuales; conservar el pedido histórico sin editarlo. Aceptación: Un comprador confirma un pedido sintético, reintenta sin duplicarlo y repite la compra después de cambiar el precio; el histórico conserva su importe. | | |
| TASK-006 | Agregar en `services/fulfillment/` estados `submitted`, `accepted`, `partially_fulfilled`, `fulfilled` y `cancelled`, con versión esperada y cantidades surtidas que nunca excedan las pedidas. Ejecutar piloto development → testing. Aceptación: Un vendedor registra surtidos parciales, el comprador consulta el avance y las pruebas rechazan sobre-surtido, cruce de cuenta y doble aplicación de la misma operación. | | |

## 3. Alternatives

- **ALT-001**: Servidores siempre activos no se eligen para esta primera versión por su costo en reposo.
- **ALT-002**: Step Functions no agrega valor al CRUD de la base; reconsiderar para procesos con etapas recuperables.
- **ALT-003**: Reutilizar el proyecto original se descarta en esta preparación; una implementación propia separa marca, datos y reglas de cliente.

## 4. Dependencies

- **DEP-001**: Node.js 24, Angular 22.3 y NgRx Signals 22.0.1.
- **DEP-002**: AWS SAM CLI o cfn-lint para infraestructura.
- **DEP-003**: Cuenta y roles OIDC por ambiente, aún sin provisionar por esta preparación.
- **DEP-004**: Acordar retención y recuperación antes de incorporar datos de clientes.

## 5. Files

- **FILE-001**: `services/domain/order.mjs` y `order.test.mjs`.
- **FILE-002**: `infra/template.yaml`, `infra/environments.json`, `infra/samconfig.toml`.
- **FILE-003**: `web/src/app/features/` para el flujo Angular.
- **FILE-004**: `services/shared/identity.mjs` y los adaptadores futuros descritos en cada tarea.
- **FILE-005**: `docs/architecture/ARCHITECTURE.md`, `docs/PRODUCTO.md`, `docs/operacion.md`.

## 6. Testing

- **TEST-001**: Ejecutar `node --test services/domain/order.test.mjs`; seis casos de dominio deben pasar.
- **TEST-002**: Probar token ausente, membresía retirada y acceso cruzado por organización antes de exponer negocio.
- **TEST-003**: Ejecutar dos comandos concurrentes contra DynamoDB real de development y demostrar una sola aceptación cuando compiten por el mismo recurso.
- **TEST-004**: Completar el flujo sintético en Angular y repetirlo en testing con un usuario independiente.
- **TEST-005**: Compilar `web/`, validar SAM, revisar el artefacto y probar restauración hacia recursos separados.

## 7. Risks & Assumptions

- **RISK-001**: Una prueba pura no demuestra atomicidad de DynamoDB. Las tareas de persistencia bloquean la operación comercial.
- **RISK-002**: Datos retenidos, logs, backups pueden generar costo sin solicitudes.
- **RISK-003**: Se debe validar la utilidad y precio del producto con compradores; no hay demanda confirmada.
- **ASSUMPTION-001**: El primer piloto usa una organización y datos sintéticos; el aislamiento entre dos organizaciones se prueba antes de datos reales.

## 8. Related Specifications / Further Reading

- [Producto](../docs/PRODUCTO.md)
- [Arquitectura](../docs/architecture/ARCHITECTURE.md)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [DynamoDB bajo demanda](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html)
- [NgRx SignalStore](https://ngrx.io/guide/signals/signal-store)

