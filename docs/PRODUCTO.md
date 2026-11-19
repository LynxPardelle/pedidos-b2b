# Pedidos B2B

## Problema y comprador

Recibir pedidos recurrentes de compradores empresariales con precios autorizados por cuenta, importes exactos y seguimiento de surtido.

Cliente inicial: Distribuidores y mayoristas que reciben compras repetidas de clientes empresariales.

## Propuesta de producto

Entrar como comprador → consultar catálogo autorizado → preparar pedido → confirmar una vez → seguir surtido → repetir con los precios vigentes.

La primera versión debe completar este flujo con una organización y usuarios de prueba. La preparación actual contiene la base técnica y reglas puras; la persistencia, autenticación y operación comercial se implementan por fases.

## Modelo de ingresos y validación

Configuración de catálogo y cuentas, más licencia mensual por distribuidor. Validar disposición a pagar y ahorro de captura con un piloto.

El piloto deberá medir tiempo de operación antes/después, errores evitados, usuarios que repiten el flujo y costo por organización. Son hipótesis de producto; el estado del repositorio no acredita demanda.

## Alcance inicial

- Cuentas empresariales con compradores y vendedores autorizados.
- Catálogo y condiciones por cuenta; precios resueltos en el servidor.
- Pedidos en unidades monetarias enteras y una moneda por pedido.
- Confirmación idempotente y seguimiento de surtido.
- Recompra como pedido nuevo con precios vigentes, preservando el histórico.

## Fuera de la primera versión

Marketplace, crédito financiado por ZooBeriah, inventario de almacén completo, facturación fiscal y procesamiento de pagos. El producto se especializa en operación repetida de pedidos entre distribuidor y compradores.

## Aislamiento y datos

Organizaciones separadas por membresías verificadas. El navegador nunca define su autoridad enviando un `organizationId`. Usar datos sintéticos hasta pasar las pruebas de permisos, respaldo y retención. El modelo conceptual proviene de TiendaDigital; toda la implementación y el diseño de este producto son propios.

## Primera tarea

`TASK-002`: identidad y acceso por comprador/empresa antes de aceptar pedidos desde HTTP.

