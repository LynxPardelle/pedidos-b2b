# Arquitectura de Pedidos B2B

## Decisión

Usar Angular standalone para la aplicación, NgRx SignalStore por flujo y carga diferida por ruta. El backend se divide por capacidad de negocio; cada servicio mantiene sus contratos, autorización y almacenamiento. La base sólo expone health.

HTTP API y Lambda Node.js 24 ARM64 atienden comandos y consultas cortas. DynamoDB `PAY_PER_REQUEST` conserva el estado. El catálogo futuro tendrá su propia tabla; el servicio de pedidos consume una versión autorizada de su contrato sin escribir directamente en los datos del catálogo.

## Límites de servicio previstos

| Servicio | Responsabilidad | Almacenamiento |
|---|---|---|
| Identidad/cuentas | Resolver organización y cuenta de comprador | Tabla propia futura |
| Catálogo | Productos autorizados, precios y versiones por cuenta | Tabla propia futura |
| Pedidos | Totales, confirmación idempotente y pedidos históricos | OrdersTable |
| Surtido | Cantidades entregadas y evolución del pedido | Límite de servicio documentado; persistencia definida en TASK-006 |
| Notificaciones | Avisos después de confirmar pedidos/cambios | SQS y DLQ cuando se implemente el primer consumidor |

La plantilla actual materializa HTTP API, health, logs y OrdersTable. Los límites futuros no se anuncian como endpoints ya implementados.

## Patrones y consistencia

- **Tenant boundary:** membresía derivada del JWT validado y comprobada en cada operación.
- **Optimistic concurrency:** versión esperada y condición en la escritura; una lectura seguida de escritura incondicional no protege la operación.
- **Idempotencia:** clave acotada a organización y usuario/cuenta, hash del comando y resultado persistido en la misma transacción que el cambio.
- **Inmutabilidad del pedido:** el servidor fija precios/moneda antes de confirmar; una recompra genera otro pedido y no reescribe el anterior.
- **Mensajería por necesidad:** SQS con DLQ para avisos y reintentos de consumidores. No agregar un bus sin productores/consumidores definidos.
- **Orquestación:** no usar Step Functions para el CRUD. Añadir una máquina de estados sólo si un proceso real requiere esperas, recuperación por etapa o compensación.

## API y seguridad

`GET /api/health` es público y no consulta datos de negocio. Las demás rutas no están creadas. Antes de añadirlas, configurar Cognito/JWT y permisos por recurso. Mantener CORS restringido a los orígenes de cada ambiente; la base usa mismo origen/proxy y no declara comodines.

La Lambda de health carece de permisos para la tabla. Los permisos de pedidos se añadirán sólo a su rol y acciones concretas.

## Ambientes y promoción

Tres stacks independientes en `infra/environments.json`: development/development, testing/testing y production/main. Nombres físicos generados por CloudFormation evitan colisiones de tablas y buckets. Idealmente usar cuentas AWS separadas; si se usa una cuenta al inicio, exigir roles OIDC y recursos separados por stack. No compartir datos, secretos ni pools de usuarios entre ambientes.

GitHub valida la cadena `development → testing → main`. Una promoción no debe reconstruir reglas de negocio diferentes ni usar secretos de otro ambiente. La base no tiene despliegue automático de AWS configurado.

## Costos y operación

Sin instancias, NAT Gateway, balanceador, OpenSearch ni capacidad Lambda aprovisionada. El cómputo se factura por uso; DynamoDB usa capacidad bajo demanda. Persisten costos posibles por almacenamiento, logs, backups y transferencia. No se promete costo cero.

Logs: 14 días. Point-in-time recovery de DynamoDB está activo sólo en producción; debe presupuestarse antes del piloto. Tabla usa `Retain`: borrar el stack no elimina los datos ni sus costos. Documentar retención y limpieza antes de datos reales. Presupuestos, alertas y prueba de restauración son condiciones del piloto.

## Estado verificable

`services/domain/order.mjs` ofrece `prepareOrder` y `acceptIdempotentOrder`: calcula unidades monetarias enteras, valida cantidades y duplicados, controla organización/comprador y detecta reintentos. Los precios deben venir de un catálogo autorizado del servidor. El registro de idempotencia devuelto aún no se persiste.

Las seis pruebas de dominio pasan con Node 24. No hay garantía de concurrencia distribuida hasta implementar y verificar el repositorio transaccional.

