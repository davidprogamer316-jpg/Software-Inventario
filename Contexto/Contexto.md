# TuboGest ERP

**Versión:** 0.1.0 (MVP - Ventas + Inventario por metros/cm + Facturación + Proveedores + Roles + Dashboard)
**Fecha:** Julio 2026
**Tipo:** Aplicación Web (ERP modular)
**Tecnología Backend:** Node.js / Express + TypeScript
**Tecnología Frontend:** React 19 + TypeScript + Tailwind CSS v4 (Next.js 16)
**Base de Datos:** MongoDB Atlas

> Nota: el nombre "TuboGest ERP" es un nombre de trabajo provisional. Puede renombrarse en cualquier momento sin afectar la arquitectura descrita en este documento.

---

## 1. Descripción General

Sistema ERP web, de uso interno, orientado a la gestión comercial y administrativa de una empresa distribuidora/comercializadora de tubos y materiales relacionados (PVC, metal, etc.), donde el producto puede venderse **por unidad completa o fraccionado por metros/centímetros**. Cuenta con los siguientes módulos principales:

1. **Ventas** — registro de ventas con selección de producto y cantidad en la unidad de venta correspondiente (unidad, metro o centímetro), cálculo automático de subtotales y total, y descuento automático de inventario.
2. **Inventario / Productos** — catálogo de productos (tubos y otros materiales) con control de stock, unidad de venta, precio y **stock mínimo configurable** para generar alertas.
3. **Alertas de Stock** — notificaciones visuales cuando un producto alcanza o queda por debajo de su stock mínimo.
4. **Facturación** — generación de facturas en PDF (estilo ticket POS) a partir de una venta.
5. **Proveedores y Compras** — registro de proveedores y de las compras/ingresos de mercancía, que alimentan automáticamente el stock.
6. **Ingresos y Egresos** — control de caja: ingresos (auto-calculados desde ventas + ingresos manuales) y egresos (gastos operativos, compras a proveedores, gastos fijos).
7. **Empleados y Roles** — gestión de empleados con acceso al sistema mediante **rol Administrador** o **rol Empleado**, cada uno con permisos diferenciados.
8. **Reportes** — reportes de ventas, inventario, ingresos/egresos y desempeño de empleados, exportables a Excel/PDF.
9. **Dashboard** — panel general con indicadores clave (ventas, ingresos, egresos, productos con bajo stock, top productos/empleados).

El sistema está diseñado para crecer de forma modular (estilo Odoo), permitiendo agregar en versiones futuras módulos adicionales (clientes, créditos, múltiples sucursales, cotizaciones, etc.) sin reescribir los módulos existentes.

---

## 2. Alcance

- Aplicación web accesible desde navegador, con backend centralizado y base de datos MongoDB.
- Arquitectura modular pensada para crecer (ERP).
- Multiusuario desde el diseño, con **control de acceso basado en roles (RBAC)** definido desde esta primera versión: Administrador y Empleado.
- Manejo de inventario con soporte de **ventas fraccionadas** (metros/centímetros) además de ventas por unidad completa.
- No se contempla en esta versión integración con pasarelas de pago, facturación electrónica ante entidades gubernamentales, ni múltiples sucursales/bodegas (queda como módulo futuro).

---

## 3. Stakeholders

- **Usuario principal:** Administrador / dueño del negocio (control total: inventario, precios, proveedores, empleados, finanzas y reportes).
- **Usuarios secundarios:** Empleados (acceso operativo limitado: ventas y consulta de stock/sus propias ventas).

---

## 4. Requerimientos Funcionales

### 4.1 Gestión de Roles y Usuarios

- El sistema debe soportar dos roles principales:
  - **Administrador**: acceso completo a todos los módulos y funciones.
  - **Empleado**: acceso restringido, definido en la sección 4.1.1.
- Cada usuario del sistema (`User`) tiene: nombre, email/usuario, contraseña (hash), rol, estado (activo/inactivo), y opcionalmente referencia a un `Employee`.
- El rol del usuario determina qué rutas del backend y qué vistas/acciones del frontend están disponibles (RBAC aplicado en middleware del backend, no solo ocultando botones en el frontend).
- Un Administrador puede crear, editar y desactivar cuentas de usuario (incluyendo otros administradores y empleados).

#### 4.1.1 Permisos por Rol (matriz inicial — ampliable)

| Módulo / Acción | Administrador | Empleado |
|---|---|---|
| Ventas: crear venta | ✅ | ✅ |
| Ventas: ver todas las ventas (de todos los empleados) | ✅ | ❌ (solo las propias) |
| Ventas: anular/eliminar venta | ✅ | ❌ |
| Inventario: ver stock disponible | ✅ | ✅ |
| Inventario: crear/editar/eliminar producto | ✅ | ❌ |
| Inventario: ajustar stock manualmente | ✅ | ❌ |
| Alertas de stock: ver | ✅ | ✅ (solo lectura) |
| Facturación: generar factura de una venta propia | ✅ | ✅ |
| Facturación: ver/eliminar todas las facturas | ✅ | ❌ |
| Proveedores: gestionar (crear/editar/eliminar) | ✅ | ❌ |
| Compras a proveedores: registrar | ✅ | ❌ |
| Ingresos/Egresos: gestionar | ✅ | ❌ |
| Empleados: gestionar (crear/editar/desactivar) | ✅ | ❌ |
| Reportes financieros completos | ✅ | ❌ |
| Reporte de ventas propias | ✅ | ✅ |
| Dashboard general (financiero) | ✅ | ❌ (dashboard reducido: solo sus ventas del día/mes) |
| Configuración del sistema | ✅ | ❌ |

> Esta matriz es la línea base del MVP. Los permisos exactos de "ciertas funciones" adicionales para el Empleado (mencionadas como pendientes) se definirán y documentarán aquí a medida que se acuerden, sin requerir cambios estructurales (el sistema de permisos se diseña extensible por módulo/acción).

### 4.2 Gestión de Productos e Inventario

- El sistema debe permitir registrar productos con los siguientes datos:
  - Código/SKU (único)
  - Nombre del producto (ej. "Tubo PVC 1/2 pulgada")
  - Categoría (ej. Tubería PVC, Tubería metálica, Accesorios, Otros)
  - Material / especificación (diámetro, calibre, longitud de barra de fábrica, etc.)
  - **Unidad de venta**: `unidad`, `metro` o `centímetro`
  - Precio de venta por unidad de venta
  - Costo de compra (opcional, para cálculo de margen)
  - **Stock actual** (almacenado internamente en la unidad base más precisa, ver 7. Reglas de Negocio)
  - **Stock mínimo** (umbral configurable para disparar alerta de bajo stock)
  - Proveedor principal (opcional, referencia)
  - Estado (activo/inactivo — un producto inactivo no aparece disponible para venta)
- El sistema debe permitir editar y desactivar productos sin eliminar su historial de ventas/movimientos.
- El sistema debe registrar un **historial de movimientos de inventario** (`StockMovement`) por cada entrada (compra) o salida (venta, ajuste), con: producto, tipo de movimiento, cantidad, unidad, fecha, referencia (venta o compra origen), usuario responsable.
- El sistema debe permitir **ajustes manuales de inventario** (solo Administrador) con motivo obligatorio (ej. merma, corrección de conteo, producto dañado).

### 4.3 Alertas de Stock

- El sistema debe calcular automáticamente si un producto está **por debajo o igual a su stock mínimo** configurado.
- Los productos en estado de alerta se muestran:
  - En una sección/badge destacado del Dashboard ("Productos con bajo stock").
  - En un listado dedicado de alertas, filtrable por categoría.
  - Con un badge visual (`⚠️ Bajo stock` / `🔴 Agotado`) en el listado general de inventario.
- Un producto con stock = 0 se marca como **Agotado** y no puede seleccionarse para nuevas ventas (bloqueo en el formulario de venta).
- Las alertas se recalculan automáticamente en cada movimiento de inventario (venta, compra, ajuste); no requieren job/cron.

### 4.4 Módulo de Ventas

- El sistema debe permitir registrar una venta con:
  - Fecha (auto, con opción de ajuste solo para Administrador)
  - Empleado responsable (auto-asignado según el usuario autenticado)
  - Cliente (opcional: nombre y/o teléfono; sin obligatoriedad de registro de cliente formal en esta versión)
  - Uno o más ítems de venta, cada uno con:
    - Producto (buscador con autocompletado)
    - Cantidad — el campo de cantidad se comporta según la `unidad de venta` del producto:
      - `unidad`: número entero
      - `metro` / `centímetro`: número decimal (hasta 2 decimales), con conversión automática si el usuario alterna la unidad de entrada (ej. ingresar en cm y mostrar equivalente en metros)
    - Precio unitario (auto-cargado desde el producto, editable solo por Administrador para descuentos puntuales)
    - Subtotal (calculado: cantidad × precio unitario)
  - Método de pago (efectivo, transferencia, tarjeta — catálogo simple)
  - Total de la venta (suma de subtotales)
- Al confirmar una venta, el sistema:
  1. Valida que haya stock suficiente para cada ítem (en la unidad correspondiente).
  2. Descuenta automáticamente el inventario de cada producto vendido.
  3. Genera el registro de `StockMovement` tipo "salida por venta".
  4. Registra el ingreso correspondiente en el módulo de Ingresos y Egresos.
- El sistema debe impedir confirmar una venta si algún ítem excede el stock disponible, mostrando el stock máximo posible.
- El sistema debe permitir **anular una venta** (solo Administrador), lo que revierte el movimiento de inventario y el ingreso asociado, dejando trazabilidad (no se elimina físicamente el registro, se marca como anulada).
- El botón de confirmar venta se deshabilita mientras la petición está en curso, para evitar ventas duplicadas.

### 4.5 Facturación

- Generación de una factura a partir de una venta ya registrada (1 venta = 1 factura, relación directa en el MVP).
- Auto-numeración consecutiva (`FAC-0001`, `FAC-0002`, ...).
- PDF estilo **ticket POS 80mm** (mismo estándar que el sistema de referencia): fuente tipo Courier, todo en negro, 9pt mínimo.
- La tabla de ítems de la factura muestra: producto, cantidad + unidad (ej. "2.50 m"), precio unitario, subtotal.
- Total prominente al final.
- **Vista inline**: botón "Ver factura" abre el PDF en una nueva pestaña con token en la URL.
- Listado de facturas filtrable por rango de fechas, cliente y empleado (el filtro por empleado solo visible para Administrador).
- Un Empleado solo puede ver/descargar las facturas de sus propias ventas.

### 4.6 Proveedores y Compras

- El sistema debe permitir registrar proveedores con: nombre/razón social, contacto, teléfono, email, dirección, notas.
- El sistema debe permitir registrar **compras** (ingresos de mercancía) asociadas a un proveedor, con:
  - Fecha de compra
  - Uno o más ítems: producto, cantidad, unidad, costo unitario
  - Total de la compra
- Al registrar una compra:
  1. Se incrementa automáticamente el stock de cada producto involucrado.
  2. Se genera un `StockMovement` tipo "entrada por compra".
  3. Se registra automáticamente un egreso en el módulo de Ingresos y Egresos (si la compra se marca como pagada; puede quedar pendiente de pago en versiones futuras con cuentas por pagar).
- Solo el Administrador puede gestionar proveedores y compras.

### 4.7 Ingresos y Egresos

- El sistema debe llevar un registro de **ingresos**:
  - Auto-generados desde cada venta confirmada.
  - Ingresos manuales adicionales (ej. otros ingresos no asociados a una venta), registrables solo por Administrador.
- El sistema debe llevar un registro de **egresos**, desglosados en ítems, cada uno con: descripción/categoría (ej. "compra a proveedor", "arriendo", "servicios", "nómina", "otros"), monto, fecha.
- Los egresos generados automáticamente por una compra a proveedor quedan enlazados a dicha compra (trazabilidad), sin impedir su edición manual de notas.
- El sistema debe permitir consultar el balance (ingresos − egresos) por rango de fechas.
- Este módulo es accesible solo para Administrador.

### 4.8 Gestión de Empleados

- El sistema debe permitir registrar empleados con: nombre completo, documento/identificación (opcional), teléfono, fecha de ingreso, estado (activo/inactivo), y su cuenta de usuario asociada (email + rol).
- El sistema debe permitir editar y desactivar empleados sin eliminar su historial de ventas.
- Un empleado desactivado no puede iniciar sesión, pero su historial de ventas permanece visible para reportes.
- (Reservado para futuras iteraciones: cálculo de comisiones o porcentaje por ventas, similar al esquema de reparto usado en otros módulos de este tipo de sistema — **fuera de alcance del MVP actual** salvo que se defina lo contrario).

### 4.9 Reportes

- **Reporte de ventas**: por rango de fechas, filtrable por empleado y por producto/categoría. Incluye totales y detalle.
- **Reporte de inventario**: stock actual, valor total del inventario (cantidad × costo), productos con alerta de bajo stock.
- **Reporte de ingresos y egresos**: balance por periodo, desglose por categoría.
- **Reporte de desempeño por empleado**: total vendido, número de ventas, ticket promedio, en un rango de fechas.
- Todos los reportes deben poder exportarse a Excel (`.xlsx`), siguiendo el mismo estándar de estilos profesionales (encabezados con color de marca, filas alternadas, formato moneda) usado en proyectos previos de la empresa.
- Los reportes financieros completos (ingresos/egresos, valor de inventario a costo) son visibles solo para Administrador. Un Empleado solo accede al reporte de sus propias ventas.

### 4.10 Dashboard

- **Dashboard de Administrador**:
  - Ventas totales del período seleccionado (ingresos por ventas).
  - Egresos totales del período.
  - Balance (ingresos − egresos).
  - Número de ventas realizadas.
  - Productos con alerta de bajo stock (listado destacado).
  - Top 5 productos más vendidos (por cantidad o por monto).
  - Top empleados por ventas.
  - Gráfico de evolución de ventas vs. egresos (línea o barras, por semana/día según el rango).
  - Gráfico de distribución de ventas por categoría de producto (dona).
  - **Filtro por rango de fechas** — carga por defecto el mes actual; el filtro solo se activa al presionar el botón "Filtrar" (no al cambiar las fechas), replicando el patrón usado en el proyecto de referencia.
- **Dashboard de Empleado** (vista reducida):
  - Sus ventas del día y del mes.
  - Número de ventas realizadas por él/ella.
  - Acceso rápido a "Nueva venta".
  - Sin cifras de egresos, utilidad ni datos de otros empleados.

### 4.11 Autenticación y Seguridad

- **Login obligatorio** con JWT + bcrypt.
- **Sin registro público** — las cuentas se crean únicamente por un Administrador desde el módulo de Empleados/Usuarios.
- **Bloqueo por fuerza bruta:** 5 intentos fallidos bloquean la cuenta por 30 minutos (HTTP 423 LOCKED), replicando el estándar usado en proyectos previos.
- **Middleware acepta `token` query param** como fallback para abrir PDFs (facturas) en nueva pestaña.
- **RBAC en backend:** cada endpoint valida el rol del usuario autenticado, no solo el frontend oculta opciones. Un Empleado que intente acceder por API directa a un endpoint restringido recibe HTTP 403.
- **CORS:** soporta múltiples orígenes y Vercel preview subdomains.
- Contraseñas con hash bcrypt, nunca en texto plano.

### 4.12 Módulos Futuros (fuera de alcance, solo referencia arquitectónica)

- Comisiones/porcentaje de venta por empleado.
- Gestión de clientes con historial de compras y crédito.
- Múltiples sucursales/bodegas con transferencias de stock entre ellas.
- Cuentas por pagar a proveedores (compras a crédito).
- Cotizaciones/presupuestos previos a la venta.
- Facturación electrónica ante entidades gubernamentales.
- Permisos granulares adicionales para el rol Empleado, a definir progresivamente.

---

## 5. Requerimientos No Funcionales

### 5.1 Tecnología

- **Backend:** Node.js con Express + TypeScript, ESM (`module: "esnext"`, `"type": "module"`).
- **Persistencia:** Mongoose (ODM para MongoDB).
- **Base de datos:** MongoDB Atlas.
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.
- **Autenticación:** JWT + bcrypt + middleware Express con validación de rol.
- **Gestor de dependencias:** npm (monorepo con carpetas `backend/` y `frontend/`).

### 5.1.1 Despliegue

- **Backend:** Render (Node.js service). `.npmrc` con `include=dev` para instalar devDependencies. tsconfig con `"types": ["node"]`.
- **Frontend:** Vercel.
- **CORS:** configurado para aceptar orígenes en `CORS_ORIGIN`/`CORS_ORIGINS` (coma-separados) y Vercel preview subdomains.
- **Variables de entorno:** `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, etc.

### 5.2 Arquitectura

- Arquitectura modular: cada dominio funcional (ventas, inventario, proveedores, finanzas, empleados, reportes) en su propio módulo dentro del backend.
- Backend en capas: rutas → middleware de autenticación/roles → controladores → servicios → modelos.
- Frontend organizado por features (`features/sales/`, `features/inventory/`, `features/providers/`, etc.), componentes reutilizables.
- Separación estricta de responsabilidades (SRP).

### 5.3 Persistencia de Datos

Colecciones de MongoDB:
- `users`
- `employees`
- `products`
- `stock_movements`
- `sales` (con subdocumentos embebidos: `saleItems`)
- `invoices`
- `providers`
- `purchases` (con subdocumentos embebidos: `purchaseItems`)
- `incomes`
- `expenses`

### 5.4 Usabilidad

- Interfaz en español, estilo ERP (sidebar tipo Odoo, tablas, dashboards).
- Valores monetarios con formato colombiano (miles y decimales).
- Cantidades en metros/centímetros mostradas con su unidad explícita (ej. "2.50 m", "35 cm").
- Fechas en formato `DD/MM/YYYY`.
- **Responsive:** sidebar con hamburger toggle, `overflow-x-auto` para tablas, columnas ocultas en pantallas pequeñas.
- Confirmación antes de eliminar/anular registros críticos (ventas, productos, proveedores).
- **DateInput** componente custom para iOS (mismo patrón usado en proyectos previos).

### 5.5 Rendimiento

- Consultas, dashboard y validación de stock deben responder en menos de 2 segundos con historial de varios años.

### 5.6 Seguridad

- Autenticación JWT obligatoria en todas las rutas excepto `/auth/login`.
- Autorización por rol validada en el backend (middleware `requireRole`).
- Middleware acepta `token` query param para PDFs en nueva pestaña.
- Contraseñas con hash bcrypt.
- **Bloqueo por fuerza bruta:** 5 intentos / 30 min, HTTP 423.
- Sin registro público.
- HTTPS en producción (Render + Vercel).
- Validación de datos de entrada en todos los endpoints (incluyendo validación de stock suficiente antes de confirmar ventas).

### 5.7 Mantenibilidad

- Código tipado end-to-end (TypeScript en backend y frontend).
- Convenciones de commits y lint/typecheck documentadas en `AGENTS.md`.

---

## 6. Modelo de Datos (Documentos Principales)

### Usuario (User)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| email | String | Correo electrónico (único, usado para login) |
| passwordHash | String | Contraseña almacenada con hash (bcrypt) |
| fullName | String | Nombre completo |
| role | String (enum) | `admin` \| `employee` |
| employeeId | String (opcional) | Referencia al `Employee` asociado |
| active | Boolean | Estado de la cuenta |
| failedLoginAttempts | Integer | Intentos fallidos consecutivos |
| lockedUntil | DateTime (nullable) | Fecha/hora hasta bloqueo; null = no bloqueado |
| lastLogin | DateTime | Fecha del último inicio de sesión |
| createdAt | DateTime | Fecha de creación de la cuenta |

### Empleado (Employee)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| fullName | String | Nombre completo |
| documentId | String (opcional) | Cédula/identificación |
| phone | String (opcional) | Teléfono de contacto |
| hireDate | Date | Fecha de ingreso |
| active | Boolean | Estado activo/inactivo |
| userId | String | Referencia al `User` asociado |

### Producto (Product)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| sku | String | Código único del producto |
| name | String | Nombre del producto |
| category | String | Categoría (ej. "Tubería PVC") |
| spec | String (opcional) | Especificación técnica (diámetro, calibre, etc.) |
| saleUnit | String (enum) | `unit` \| `meter` \| `centimeter` |
| salePrice | BigDecimal | Precio de venta por unidad de venta |
| costPrice | BigDecimal (opcional) | Costo de compra por unidad de venta |
| stockQuantity | BigDecimal | Stock actual, almacenado en la unidad base del producto |
| minStock | BigDecimal | Umbral mínimo para disparar alerta de bajo stock |
| providerId | String (opcional) | Proveedor principal |
| active | Boolean | Estado activo/inactivo |

### Movimiento de Inventario (StockMovement)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| productId | String | Referencia al producto |
| type | String (enum) | `sale_out` \| `purchase_in` \| `manual_adjustment` |
| quantity | BigDecimal | Cantidad del movimiento (en la unidad de venta del producto) |
| reason | String (opcional) | Motivo (obligatorio si `manual_adjustment`) |
| referenceId | String (opcional) | Referencia a `Sale` o `Purchase` origen |
| userId | String | Usuario responsable del movimiento |
| date | DateTime | Fecha del movimiento |

### Venta (Sale)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| date | DateTime | Fecha de la venta |
| employeeId | String | Empleado responsable |
| customerName | String (opcional) | Nombre del cliente |
| customerPhone | String (opcional) | Teléfono del cliente |
| items | List\<SaleItem\> | Ítems vendidos |
| paymentMethod | String (enum) | `cash` \| `transfer` \| `card` |
| total | BigDecimal | Total de la venta |
| status | String (enum) | `completed` \| `voided` |
| voidedReason | String (opcional) | Motivo de anulación |

### Ítem de Venta (SaleItem) — subdocumento embebido
| Campo | Tipo | Descripción |
|---|---|---|
| productId | String | Referencia al producto |
| productName | String | Nombre (copia histórica) |
| saleUnit | String | Unidad de venta usada (copia histórica) |
| quantity | BigDecimal | Cantidad vendida |
| unitPrice | BigDecimal | Precio unitario aplicado |
| subtotal | BigDecimal | Calculado: `quantity * unitPrice` |

### Factura (Invoice)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| invoiceNumber | String | Número auto-generado (`FAC-0001`) |
| saleId | String | Referencia a la venta origen |
| customerName | String (opcional) | Nombre del cliente |
| date | DateTime | Fecha de emisión |
| items | List\<InvoiceItem\> | Copia de los ítems de la venta |
| total | BigDecimal | Total de la factura |

### Ítem de Factura (InvoiceItem) — subdocumento embebido
| Campo | Tipo | Descripción |
|---|---|---|
| description | String | Nombre del producto + cantidad/unidad |
| quantity | BigDecimal | Cantidad |
| saleUnit | String | Unidad de venta |
| unitPrice | BigDecimal | Precio unitario |
| subtotal | BigDecimal | Subtotal del ítem |

### Proveedor (Provider)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| name | String | Nombre/razón social |
| contactName | String (opcional) | Persona de contacto |
| phone | String (opcional) | Teléfono |
| email | String (opcional) | Correo |
| address | String (opcional) | Dirección |
| notes | String (opcional) | Notas adicionales |

### Compra (Purchase)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| providerId | String | Proveedor asociado |
| date | DateTime | Fecha de la compra |
| items | List\<PurchaseItem\> | Ítems comprados |
| total | BigDecimal | Total de la compra |
| paid | Boolean | Indica si ya se registró como egreso |

### Ítem de Compra (PurchaseItem) — subdocumento embebido
| Campo | Tipo | Descripción |
|---|---|---|
| productId | String | Referencia al producto |
| quantity | BigDecimal | Cantidad comprada |
| unitCost | BigDecimal | Costo unitario |
| subtotal | BigDecimal | Calculado: `quantity * unitCost` |

### Ingreso (Income)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| date | DateTime | Fecha del ingreso |
| source | String (enum) | `sale` \| `manual` |
| referenceId | String (opcional) | Referencia a `Sale` si `source = sale` |
| description | String | Descripción |
| amount | BigDecimal | Monto |

### Egreso (Expense)
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (ObjectId) | Identificador único |
| date | DateTime | Fecha del egreso |
| category | String | Categoría (compra proveedor, arriendo, servicios, nómina, otros) |
| referenceId | String (opcional) | Referencia a `Purchase` si aplica |
| description | String | Descripción |
| amount | BigDecimal | Monto |

---

## 7. Reglas de Negocio

- **Unidad base de inventario:** para productos con `saleUnit = meter` o `centimeter`, el stock se almacena internamente en centímetros (mayor precisión, evita errores de redondeo); la interfaz siempre muestra y captura la cantidad en la unidad de venta configurada para ese producto, con conversión automática.
- **Subtotal de ítem de venta:** `subtotal = quantity * unitPrice`, donde `quantity` está expresado en la unidad de venta del producto.
- **Validación de stock:** una venta no puede confirmarse si algún ítem solicita más cantidad de la disponible en `stockQuantity` del producto correspondiente.
- **Descuento automático de stock:** al confirmar una venta, `stockQuantity -= quantity` para cada producto vendido; se genera un `StockMovement` tipo `sale_out`.
- **Reingreso de stock por anulación:** al anular una venta, se revierte el descuento (`stockQuantity += quantity` por cada ítem) y se genera un `StockMovement` de reversa; la venta queda marcada `voided`, no se elimina.
- **Incremento automático de stock por compra:** al registrar una compra, `stockQuantity += quantity` para cada producto; se genera un `StockMovement` tipo `purchase_in`.
- **Alerta de bajo stock:** un producto se considera en alerta cuando `stockQuantity <= minStock`. Se considera **agotado** cuando `stockQuantity == 0`; un producto agotado no puede seleccionarse en el formulario de venta.
- **Ingreso automático por venta:** cada venta confirmada genera un registro en `Income` con `source = sale` por el `total` de la venta.
- **Egreso automático por compra:** cada compra marcada como pagada genera un registro en `Expense` con `category = "compra proveedor"` por el `total` de la compra.
- **RBAC estricto en backend:** cada endpoint valida el rol del usuario mediante middleware (`requireRole('admin')`, etc.); el frontend oculta opciones no permitidas, pero la validación real ocurre siempre en el servidor.
- **Un Empleado solo ve sus propias ventas y facturas**, salvo que el permiso se amplíe explícitamente en una futura iteración de la matriz de roles (sección 4.1.1).
- **El sistema solo permite acceso a usuarios autenticados y activos.** Sin auto-registro.
- **Límite de intentos de login:** 5 fallidos → bloqueo 30 min → HTTP 423.
- **Numeración de facturas:** consecutiva y única (`FAC-0001`, `FAC-0002`, ...), nunca reutilizada aunque se elimine una factura.
- **Botón de confirmar venta deshabilitado** mientras la petición está en curso, para evitar ventas duplicadas.
- **Formato de moneda:** `$#,##0.00`, formato colombiano en la interfaz.

---

## 8. Casos de Uso Principales

| ID | Caso de Uso | Actor |
|---|---|---|
| CU-01 | Iniciar sesión (login) | Administrador / Empleado |
| CU-02 | Cerrar sesión (logout) | Administrador / Empleado |
| CU-03 | Bloquear cuenta por intentos fallidos de login | Sistema |
| CU-04 | Desbloquear cuenta manualmente | Administrador |
| CU-05 | Crear/editar/desactivar usuario y asignar rol | Administrador |
| CU-06 | Registrar nuevo producto (con unidad de venta) | Administrador |
| CU-07 | Editar/desactivar producto | Administrador |
| CU-08 | Ajustar stock manualmente (con motivo) | Administrador |
| CU-09 | Ver listado de inventario con alertas de bajo stock | Administrador / Empleado |
| CU-10 | Registrar una venta (por unidad, metro o centímetro) | Administrador / Empleado |
| CU-11 | Anular una venta | Administrador |
| CU-12 | Ver historial de ventas propias | Empleado |
| CU-13 | Ver historial de todas las ventas con filtros | Administrador |
| CU-14 | Generar factura desde una venta | Administrador / Empleado |
| CU-15 | Ver/descargar PDF de factura (estilo ticket POS) | Administrador / Empleado |
| CU-16 | Registrar proveedor | Administrador |
| CU-17 | Registrar compra a proveedor (ingreso de stock) | Administrador |
| CU-18 | Ver historial de compras por proveedor | Administrador |
| CU-19 | Registrar egreso manual | Administrador |
| CU-20 | Registrar ingreso manual | Administrador |
| CU-21 | Ver balance de ingresos/egresos por periodo | Administrador |
| CU-22 | Registrar empleado y su cuenta de acceso | Administrador |
| CU-23 | Editar/desactivar empleado | Administrador |
| CU-24 | Ver dashboard general (financiero y de inventario) | Administrador |
| CU-25 | Ver dashboard reducido (ventas propias) | Empleado |
| CU-26 | Exportar reporte de ventas/inventario/finanzas a Excel | Administrador |
| CU-27 | Exportar reporte de ventas propias a Excel | Empleado |
| CU-28 | Filtrar dashboard por rango de fechas | Administrador / Empleado |

---

## 9. Criterios de Aceptación

- Al confirmar una venta, el sistema valida stock disponible antes de descontar inventario.
- El sistema impide vender más cantidad de la disponible en stock, indicando el máximo posible.
- Un producto con `stockQuantity == 0` no puede seleccionarse en el formulario de venta.
- Las alertas de bajo stock se recalculan automáticamente tras cada venta, compra o ajuste manual.
- Cada venta confirmada genera automáticamente un registro de ingreso.
- Cada compra marcada como pagada genera automáticamente un registro de egreso.
- Un usuario con rol Empleado no puede acceder (ni siquiera por API directa) a endpoints de administración de productos, proveedores, empleados o finanzas; el backend responde HTTP 403.
- Un Empleado solo visualiza sus propias ventas y facturas en las vistas correspondientes.
- La numeración de facturas es consecutiva y sin duplicados.
- La exportación a Excel genera un archivo `.xlsx` válido con estilos profesionales.
- El dashboard muestra correctamente los totales acumulados y gráficos, respetando la vista reducida para el rol Empleado.
- Ningún endpoint (excepto login) responde sin token JWT válido.
- Usuario no autenticado es redirigido al login.
- Contraseñas nunca en texto plano.
- Tras 5 intentos fallidos de login → HTTP 423.
- Al anular una venta, el stock revertido coincide exactamente con lo descontado originalmente.
- Las cantidades en metros/centímetros se muestran siempre con su unidad explícita en toda la interfaz.
- Vista inline de facturas PDF funciona en nueva pestaña con token.
- Botón de confirmar venta se deshabilita mientras se procesa la petición.

---

## 10. Entregables

- Código fuente del backend (Node.js + Express + TypeScript, ESM).
- Código fuente del frontend (Next.js 16 + TypeScript + Tailwind CSS v4).
- Documentación de la API REST (endpoints documentados en código, incluyendo qué rol requiere cada uno).

---

## 11. Sistema de Diseño

El diseño completo (colores, tipografía, layout, componentes, login, responsive, animaciones) está documentado en `Diseno.md`, siguiendo el mismo lenguaje visual usado en proyectos previos de la empresa, adaptado a este nuevo dominio.

---

## 12. Decisiones de Diseño Confirmadas

1. **Stock fraccionado:** productos con `saleUnit = meter/centimeter` almacenan el stock internamente en centímetros para evitar errores de redondeo; la interfaz siempre opera en la unidad de venta configurada.
2. **Ingreso auto-calculado:** cada venta confirmada genera un `Income` automático.
3. **Egreso auto-calculado:** cada compra pagada genera un `Expense` automático.
4. **RBAC desde el backend:** todos los endpoints validan rol vía middleware; el frontend solo oculta opciones como mejora de UX, nunca como única barrera de seguridad.
5. **Anulación en vez de eliminación de ventas:** preserva trazabilidad; revierte stock e ingreso asociado.
6. **Alertas de stock reactivas:** se recalculan en cada movimiento de inventario, sin necesidad de tareas programadas.
7. **Producto agotado bloqueado en el formulario de venta:** evita ventas con stock negativo.
8. **Autenticación:** JWT + bcrypt, sin registro público.
9. **Despliegue:** backend (Render), frontend (Vercel), CORS configurable.
10. **Diseño:** mismo lenguaje visual (sidebar estilo Odoo, paleta consistente con proyectos previos, gráficos con recharts), adaptado con textos/iconos propios del dominio de tubos e inventario.
11. **Exportación:** Excel con `exceljs` (estilos profesionales), replicando el estándar usado en proyectos previos.
12. **Numeración de facturas consecutiva:** nunca se reutiliza un número, incluso si se elimina una factura.
13. **Bloqueo por fuerza bruta:** 5 intentos / 30 min, HTTP 423. Desbloqueo manual desde configuración (solo Administrador).
14. **Login oscuro vs. app clara:** se mantiene el mismo patrón visual de dos caras (login oscuro/premium, app clara/funcional).
15. **Dashboard con dos vistas:** completa para Administrador, reducida (solo ventas propias) para Empleado.
16. **Dashboard filtra solo con botón:** carga el mes actual por defecto; el filtro de fechas no se aplica automáticamente al cambiar las fechas.
17. **Matriz de permisos documentada y extensible:** nuevas funciones habilitadas para Empleado se añaden a la tabla de la sección 4.1.1 sin requerir cambios estructurales.
18. **Submit de venta deshabilitado mientras se guarda:** evita ventas duplicadas.
19. **Cantidades con unidad explícita en toda la app:** ej. "2.50 m", "35 cm", "3 uds".
20. **ESM migration:** `module: "esnext"`, `"type": "module"`, imports con `.js`. tsconfig `"types": ["node"]`.
21. **`.npmrc` con `include=dev`** para que Render instale devDependencies (necesarias para TypeScript).
22. **Sin ruta `/register`:** las cuentas solo se crean desde el módulo de Empleados/Usuarios por un Administrador.

---

*Documento elaborado como base para el desarrollo del ERP de tubos. Sujeto a revisión y ajustes durante la fase de diseño, especialmente en cuanto a los permisos adicionales del rol Empleado.*
