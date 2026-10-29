# Verificación integrada de AutoAndes

Fecha: 29 de octubre de 2026. Entorno local de examen: Angular 22, Spring Boot 4 y Oracle.

## Resultados

| Capa | Verificación | Resultado |
|---|---|---|
| Frontend | Compilación de producción con `npm run build` | Correcta |
| Frontend | Vitest con `npm test -- --watch=false` | 14 pruebas aprobadas |
| Navegador | Playwright / Google Chrome, con API y Oracle reales | 5 recorridos aprobados |
| Backend | Maven / JUnit con base H2 temporal | 14 pruebas aprobadas |
| API real | Colección Postman contra Oracle | 50 solicitudes y 96 aserciones aprobadas |

Los comandos de pruebas terminaron con código de salida 0. Las pruebas unitarias de Angular usan HttpTestingController; los recorridos de navegador consumen la API real y no interceptan respuestas con datos simulados. La colección de Postman se ejecutó también en un verificador temporal en 8081 que carga los YAML actuales y la configuración local privada, para evitar interferir con el servicio existente en 8080.

## Recorridos comprobados en navegador

1. **Administrador:** login, resumen del taller, validación de formulario vacío, alta y edición de un servicio, baja por PATCH y eliminación del servicio auxiliar.
2. **Asesor / vehículos:** lista desplegable de clientes cargada desde Oracle, rechazo 409 de placa repetida, conservación del formulario, alta, filtro por cliente, edición y eliminación del vehículo auxiliar.
3. **Orden y permisos:** selección de vehículo y servicios, cálculo reactivo, rechazo de kilometraje inferior conservando líneas, agregar/quitar servicios y bloqueo de repetidos. Se comprobó que el POST contiene solo vehículo, kilometraje, servicio y cantidad. La orden se registró y luego se anuló como JEFE_TALLER; el ingreso se retiró del reporte. La ruta `/ordenes/nueva` escrita directamente para el jefe mostró acceso denegado conservando la sesión.
4. **Sesión:** cuenta inactiva rechazada, returnUrl después del login, token alterado que provoca cierre de sesión, sesión vencida descartada y página 404.
5. **Móvil:** login y pantalla de inicio a 390 × 844, navegación disponible y ausencia de desbordamiento horizontal.

## Evidencias seleccionadas

Las capturas corresponden al estado real durante las pruebas; pueden mostrar recursos auxiliares mientras se desarrolla el recorrido.

| Captura | Qué demuestra |
|---|---|
| [Inicio](evidencias/01-inicio.png) | Estilo de Pharma adaptado a AutoAndes y resumen desde la API |
| [Servicios](evidencias/02-servicios.png) | Catálogo y acciones de mantenimiento |
| [Vehículos](evidencias/03-vehiculos.png) | Relación con clientes y filtro |
| [Orden rechazada](evidencias/04-orden-409.png) | Mensaje 409 del backend con líneas conservadas |
| [Orden registrada](evidencias/05-orden-registrada.png) | Cabecera, detalle y total devuelto por el servidor |
| [Acceso denegado](evidencias/06-acceso-denegado.png) | Guard de permiso sin cerrar la sesión |
| [Reporte](evidencias/07-reporte.png) | Ingresos por servicio |
| [Login](evidencias/08-login.png) | Acceso fuera del layout |
| [Móvil](evidencias/09-movil.png) | Adaptación de la interfaz a pantalla pequeña |

Los recursos auxiliares de CRUD se eliminaron al completar los recorridos. Se retiró también el vehículo auxiliar que dejó un intento interrumpido. Las órdenes de evidencia se conservan ANULADAS para poder revisar el resultado sin incorporarlas a los ingresos.

## Correcciones encontradas durante las pruebas

- El componente de error por campo se configuró para actualizarse al cambiar el estado de los controles reactivos, de modo que un envío vacío muestra las validaciones inmediatamente.
- Los selectores del navegador usan las etiquetas de las opciones enlazadas mediante `ngValue`, y el filtro de cliente se identifica por su rol accesible.
- Un 401 de un destino ajeno a la API no cierra la sesión de AutoAndes.

## Configuración y publicación del código

Las credenciales Oracle y la clave JWT de desarrollo están en `application-local.yaml` del backend, excluido de Git. Se generó una clave local distinta de la usada por las pruebas unitarias y se comprobó que los archivos versionados no contienen esa clave ni la contraseña Oracle. El repositorio incluye un archivo de ejemplo para configurar cada equipo.

Los resultados completos de Playwright quedan localmente en `playwright-report/` y `test-results/`, excluidos de Git. La revisión automatizada del navegador integrado de Codex no pudo iniciarse porque su revisión de permisos agotó el tiempo o la capacidad disponible; las pruebas repetibles de Chrome y las capturas de este informe sí se completaron.
