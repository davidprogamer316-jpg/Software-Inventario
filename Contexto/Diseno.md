# Sistema de Diseño — TuboGest ERP

> Documentación visual y de componentes de la interfaz. Mantiene el mismo lenguaje de diseño usado en proyectos ERP previos de la empresa, adaptado a este nuevo dominio (ventas/inventario de tubos).

---

## 1. Filosofía

Dos caras de una misma identidad, replicando el mismo patrón usado en proyectos anteriores:

- **Login**: oscuro, profesional, técnico/industrial. Transmite solidez y seguridad (negocio de materiales/ferretería).
- **App interior**: clara, funcional, tipo ERP. Prioriza legibilidad de datos numéricos (stock, precios, cantidades por metro/cm) y eficiencia operativa, especialmente para el flujo rápido de ventas en mostrador.

La paleta se inspira en un depósito/ferretería ordenado: el azul acero de la estructura metálica, el naranja de la señalización industrial, y el gris claro del concreto/bodega.

---

## 2. Paleta de Colores

| Token            | Hex       | Uso |
|------------------|-----------|-----|
| `brand`          | `#1A2333` | Sidebar, login completo |
| `brand-hover`    | `#26324A` | Hover de elementos brand |
| `accent`         | `#E8823C` | Botones principales, indicadores activos, highlights |
| `accent-light`   | `#F2A66B` | Hover/light variant de accent |
| `bg-page`        | `#F4F5F7` | Fondo de páginas interiores |
| `surface`        | `#FFFFFF` | Fondo de tarjetas y contenedores |
| `text-body`      | `#232733` | Texto principal |
| `text-muted`     | `#7A8194` | Texto secundario, etiquetas, placeholders |
| `success`        | `#4F9E6D` | Estados exitosos, stock saludable |
| `warning`        | `#D8A13A` | Alertas de bajo stock |
| `danger`         | `#C25454` | Errores, agotado, anulaciones |
| `border`         | `#E2E5EA` | Bordes de tarjetas, inputs, divisores ligeros |

### Login (oscuro) — variantes sobre brand

| Elemento          | Clase/Valor               |
|-------------------|---------------------------|
| Fondo página      | `bg-brand` (`#1A2333`)   |
| Tarjeta           | `bg-white/5`, `border-white/10` |
| Inputs            | `bg-white/5`, `border-white/10`, `text-white`, `placeholder-white/20` |
| Input iconos      | `text-white/30`           |
| Labels            | `text-white/50`           |
| Botón submit      | `bg-accent` (`#E8823C`), `text-brand` (`#1A2333`) |
| Banner bloqueo    | `bg-orange-500/10`, `border-orange-400/30`, `text-orange-300/400` |
| Error             | `bg-red-500/10`, `border-red-500/20`, `text-red-400` |
| Footer            | `text-white/20`           |

### App interior (claro)

| Elemento          | Clase/Valor                        |
|-------------------|------------------------------------|
| Fondo página      | `bg-bg-page` (`#F4F5F7`)          |
| Tarjetas          | `bg-surface` (`#FFFFFF`), `border border-border` (`#E2E5EA`) |
| Inputs            | `bg-bg-page` (`#F4F5F7`), `border-border` |
| Texto labels      | `text-text-muted` (`#7A8194`)     |
| Texto valores     | `text-text-body` (`#232733`)      |
| Botones           | `bg-accent` (`#E8823C`), `text-white` |
| Badge activo/stock OK | `bg-emerald-100 text-emerald-700`  |
| Badge bajo stock  | `bg-amber-100 text-amber-700`      |
| Badge agotado     | `bg-red-100 text-red-700`          |
| Badge inactivo/anulado | `bg-gray-100 text-gray-500`   |

---

## 3. Tipografía

| Rol        | Fuente              | Variable CSS           | Uso |
|------------|---------------------|------------------------|-----|
| Headings   | Plus Jakarta Sans   | `--font-heading`       | Títulos, logo, headers de sección |
| Body       | Inter               | `--font-body`          | Texto general, inputs, tablas, etiquetas |

Ambas cargadas desde Google Fonts via `next/font/google` en `layout.tsx`.

**PDFs (facturas):** Courier / CourierPrime (TTF empaquetado en `backend/assets/fonts/`). Todo `#000`, 9pt mínimo, 204pt de ancho — mismo estándar que otros documentos térmicos generados por la empresa.

---

## 4. Layout y Estructura

### Sidebar (estilo Odoo)
- **Ancho**: 224px (`w-56`)
- **Fijo**: `fixed top-0 left-0 h-full`
- **Fondo**: `bg-brand` (`#1A2333`)
- **Overlay mobile**: `fixed inset-0 z-30 bg-black/50`
- **Z-index sidebar**: `z-40`
- **Transición**: `duration-200 ease-in-out` en translate X
- **Responsive**: mobile oculto con `-translate-x-full`, desktop siempre visible con `md:translate-x-0`
- **Sombra**: `shadow-lg`
- **Hamburger toggle**: botón para abrir/cerrar en mobile
- **Navegación condicional por rol**: los ítems de Proveedores, Ingresos/Egresos, Empleados y Configuración solo se renderizan si `user.role === 'admin'`. El ítem "Ventas" y "Nueva venta" siempre visible para ambos roles.

### Páginas interiores
- **Contenedor**: margen izquierdo igual al sidebar (`md:ml-56`) + `p-6` o `px-6 pb-8`
- **Ancho máximo formularios**: `max-w-2xl` (672px centrado)
- **Tablas**: `overflow-x-auto` con scroll horizontal en mobile
- **Columnas responsive en tablas**: columnas secundarias (costo, proveedor, empleado) ocultas en `<sm`, columnas de detalle financiero ocultas en `<lg` para vistas de Empleado

### Tarjetas
- `rounded-xl border border-border p-6 shadow-sm bg-surface`

### Inputs (app interior)
- `rounded-lg border border-border bg-bg-page px-3.5 py-2.5 text-sm text-text-body`
- Focus: `outline-none ring-2 ring-accent/40 focus:border-accent transition-colors`

### Inputs (login)
- `rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white`
- Focus: `outline-none ring-2 ring-accent/40 focus:border-accent/50`
- Con icono: `pl-10` (icono absoluto en `left-3.5`)

### Input de cantidad con unidad (específico de este proyecto)
- Input numérico + selector/label de unidad fijo a la derecha (ej. "m", "cm", "uds") dentro del mismo contenedor `relative`.
- Clase del sufijo de unidad: `absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none`
- Si el producto es `saleUnit = unit`, el input no admite decimales; si es `meter`/`centimeter`, admite hasta 2 decimales.

### Botones
- **Primario (accent)**: `rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50`
- **Submit login**: `rounded-xl bg-accent text-brand font-semibold px-4 py-3 w-full`
- **Eliminar/Anular**: `text-danger hover:text-danger/80`
- **Borde (secundario)**: `rounded-lg border border-border text-text-muted px-4 py-2 text-sm hover:bg-bg-page transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
- **Con spinner**: el icono `RefreshCw` gira con `animate-spin` mientras hay una operación en curso, y el texto cambia (ej. "Guardando...", "Anulando...")

---

## 5. Componentes Visuales

### Logo
- **Contenedor**: `w-8 h-8 rounded-lg bg-accent/20 text-accent text-sm font-bold font-heading` (sidebar)
- **Login**: `w-14 h-14 rounded-2xl bg-accent/15 text-accent text-2xl font-bold font-heading ring-1 ring-accent/20`
- Letra "T" centrada (de "TuboGest"), misma tipografía heading

### Sidebar: navegación
- Item activo: `bg-white/15 text-accent font-medium` + indicador `w-1 h-5 rounded-r-full bg-accent` (posición absoluta)
- Item inactivo: `text-white/60 hover:bg-white/5 hover:text-white/90`
- Gap entre items: `gap-0.5`
- Padding item: `px-4 py-2.5`

### Sidebar: usuario
- Avatar: `w-8 h-8 rounded-full bg-white/10 text-white/60` (primera letra del nombre)
- Nombre: `text-white/80 text-sm font-medium`
- Badge de rol junto al nombre: `text-[10px] uppercase tracking-wide text-accent/80` (ej. "Admin" / "Empleado")
- Email: `text-white/40 text-xs`
- Logout: `text-white/40 hover:text-white/60`
- Divisor: `border-t border-white/10`

### Badges de estado
- `rounded-full px-3 py-1 text-xs font-medium`
- Variantes: activo/stock OK (`success`), bajo stock (`warning`), agotado (`danger`), inactivo/anulado (gris)

### Tablas
- Encabezados: `text-text-muted text-xs font-medium uppercase tracking-wider`
- Celdas: `text-text-body text-sm`
- Filas alternadas: opcional vía `even:bg-bg-page`
- Celda de cantidad: siempre incluye la unidad junto al número (ej. `2.50 m`), alineada a la derecha, `font-medium`

### Indicador de carga
- Spinner SVG con `animate-spin` (rotación infinita)

### Secciones colapsables
- **Botón header** con `w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-page transition-colors`
- Icono `ChevronDown` que rota `-rotate-90` cuando está colapsado
- Contenido con `border-t border-border px-6 py-4`
- Usado en: detalle de venta (ítems), detalle de compra (ítems)

### Buscador de producto con autocompletado (específico de este proyecto)
- Input de búsqueda con icono `Search`, lista desplegable de resultados (`absolute z-10 w-full bg-surface border border-border rounded-lg shadow-sm mt-1`)
- Cada resultado muestra: nombre, SKU, precio, badge de stock (OK/bajo/agotado)
- Productos agotados se muestran atenuados (`opacity-50`) y no son seleccionables (`pointer-events-none`)
- Usado en: formulario de nueva venta, formulario de nueva compra

### DateInput (iOS placeholder fix)
- Wrapper `<div>` de `relative` con `<input type="date">`
- `<span>` superpuesto como placeholder (se oculta cuando hay valor)
- Clases: `absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-text-muted`
- Se oculta con `hidden` cuando el input tiene valor

---

## 6. Pantalla de Login — Diseño Específico

La pantalla de login es intencionalmente diferente al resto de la app:

- Fondo **completamente oscuro** (`bg-brand`) con tres esferas de glow naranja:
  - Centro: `w-[600px] h-[600px] rounded-full bg-accent/8 blur-3xl`
  - Top-right: `w-[400px] h-[400px] bg-accent/5 blur-3xl`
  - Bottom-left: `w-[400px] h-[400px] bg-accent/5 blur-3xl`
- Patrón de puntos tenue (`radial-gradient` con puntos blancos al 3% de opacidad)
- Tarjeta con efecto **glassmorphism** (`backdrop-blur-sm`, `bg-white/5`, `border-white/10`)
- Logo grande y glow, inputs transparentes sobre fondo oscuro
- **Sin enlace de registro** ni texto "ERP"
- El formulario de login es idéntico para ambos roles; el sistema redirige automáticamente al dashboard correspondiente (completo o reducido) según el rol tras autenticar.

Esta ruptura visual marca el contraste entre "acceso" (experiencia profesional, premium) y "trabajo" (app funcional y clara).

---

## 7. Responsive

- **Mobile**: sidebar oculto, se abre con botón hamburger + overlay oscuro
- **Tablet/media**: sidebar visible en md+
- **Tablas**: `overflow-x-auto` en todos los listados (ventas, inventario, proveedores, compras, facturas)
- **Columnas ocultas**: columnas de costo/proveedor/margen ocultas en `<sm`; columnas de detalle financiero ocultas en `<lg` para la vista de Empleado
- **Formularios**: stack vertical (`flex-col`) con inputs a ancho completo — crítico en el formulario de venta, pensado para uso rápido en tablet/mostrador
- **Tarjetas de resumen**: grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` en el dashboard
- **Formulario de venta**: en mobile, el resumen de total/ítems queda fijo en la parte inferior (`sticky bottom-0`) para facilitar el cobro sin hacer scroll

---

## 8. Animaciones y Transiciones

| Elemento        | Efecto                          |
|-----------------|----------------------------------|
| Sidebar         | `translate-x` con `duration-200 ease-in-out` |
| Botones         | `transition-colors duration-200` |
| Inputs          | `transition-colors` en focus     |
| Botón submit    | `active:scale-[0.98]` (press)    |
| Spinner         | `animate-spin`                   |
| Chevron colapsable | `transition-transform` con `-rotate-90` |
| Badge de alerta de stock | `animate-pulse` sutil solo en el badge "Agotado" del dashboard |
| Modal backdrop  | no animación (aparece/desaparece instantáneo) |

Sin animaciones decorativas superfluas — solo las necesarias para feedback funcional.

---

## 9. Iconos

Librería: **lucide-react** (v0.x). Todos los iconos son inline SVGs, color heredado del texto padre.

| Página              | Iconos usados |
|---------------------|--------------------------------------------------|
| Sidebar             | `LayoutDashboard`, `ShoppingCart`, `Package`, `Truck`, `Users`, `Wallet`, `FileText`, `Settings`, `LogOut`, `X` |
| Login               | `Mail`, `Lock`, `Eye`, `EyeOff`, `ShieldOff` |
| Nueva Venta         | `Search`, `Plus`, `Trash2`, `Ruler` (unidad metro/cm), `Package` |
| Inventario          | `Plus`, `Pencil`, `Trash2`, `AlertTriangle` (bajo stock), `PackageX` (agotado), `FileDown` |
| Proveedores/Compras | `Plus`, `Pencil`, `Trash2`, `Truck`, `FileDown` |
| Ingresos/Egresos    | `TrendingUp`, `TrendingDown`, `Plus`, `FileDown` |
| Empleados           | `Pencil`, `Trash2`, `UserCheck`, `UserX`, `Plus` |
| Facturas            | `Plus`, `FileDown`, `Trash2`, `Eye`, `Search` |
| Dashboard           | `Filter` (botón Filtrar), `AlertTriangle` (sección de alertas) |

---

## 10. Modales

- **Modal genérico** (`frontend/src/components/Modal.tsx`): backdrop oscuro `bg-black/40 backdrop-blur-sm`, tarjeta centrada `max-w-lg`, título con botón X, cierra con Escape o click fuera.
- **Responsivo en mobile:** `max-h-[70vh] overflow-y-auto`, `items-start sm:items-center`, `pt-10 sm:pt-0`, título con `truncate`.
- Usado en:
  - Detalle de venta (clic en fila del listado)
  - Generar/ver factura desde una venta
  - Ajuste manual de stock (con campo de motivo obligatorio)
  - Registrar compra a proveedor
  - Confirmación de anulación de venta
- **Modal de ajuste de stock:** formulario con producto (bloqueado si se abre desde el detalle del producto), cantidad, motivo (obligatorio). Solo accesible para Administrador.
- **Modal de confirmación de anulación:** mensaje de advertencia + resumen de lo que se revertirá (stock e ingreso), requiere confirmación explícita.

---

## 11. Componentes de Página

### Nueva Venta (página principal para el rol Empleado)
- Buscador de producto con autocompletado en la parte superior
- Lista de ítems agregados con: nombre, cantidad editable (con unidad), precio unitario, subtotal, botón eliminar
- Total grande y prominente
- Selector de método de pago
- Botón "Confirmar venta" (deshabilitado mientras se procesa)
- En mobile: resumen de total fijo en la parte inferior (`sticky bottom-0`)

### Inventario
- Tabla con: SKU, nombre, categoría, unidad de venta, precio, stock actual (con unidad), badge de estado (OK/bajo/agotado)
- Filtro por categoría y por estado de stock
- Botón "Agregar producto" (solo Administrador)
- Botón de ajuste manual de stock por fila (solo Administrador)

### Dashboard (Administrador)
- **Filtro de fechas**: inputs de fecha con botón "Filtrar" (icono `Filter`)
- **No se actualiza al cambiar fechas** — solo al presionar el botón
- **Carga por defecto**: mes actual
- Tarjetas de resumen: Ventas totales, Egresos, Balance, N.º de ventas
- Sección destacada: "Productos con bajo stock" (lista corta con badge `AlertTriangle`, enlace a inventario filtrado)
- Gráfico de barras (ventas vs. egresos) + gráfico dona (ventas por categoría de producto)
- Tabla de top empleados por ventas

### Dashboard (Empleado)
- Tarjetas: Mis ventas hoy, Mis ventas del mes, N.º de ventas realizadas
- Botón grande de acceso directo a "Nueva venta"
- Sin gráficos financieros ni datos de otros empleados

### Proveedores y Compras
- Listado de proveedores con botones editar/eliminar
- Botón "Registrar compra" que abre formulario con selector de proveedor + ítems (producto, cantidad, costo unitario)
- Historial de compras filtrable por proveedor y fechas

### Ingresos y Egresos
- Dos tablas o pestañas: Ingresos / Egresos
- Botón "Agregar ingreso/egreso manual"
- Tarjeta de balance del periodo filtrado

---

## 12. PDFs

### Factura (invoice)
- **Formato:** ticket POS 80mm, 204pt ancho, Courier/CourierPrime
- **Colores:** solo `#000` (negro), sin grises, sin colores
- **Fuente:** Courier 9pt mínimo
- **Logo:** centrado 200px, escala de grises. Opcional — si no existe el archivo de logo, se omite.
- **Sin QR**
- **Tabla de ítems:** producto, cantidad + unidad (ej. "2.50 m"), precio unitario, subtotal
- **Total:** grande, prominente
- **Botones:** "Ver factura" (ojo → inline en nueva pestaña con `?token=`), "Descargar" (download)
- Archivo: `backend/src/modules/invoices/services/invoiceService.ts`

---

## 13. Unidades de Venta (Product)

Selector de unidad de venta al crear/editar un producto:
- `unidad` (número entero, ej. codos, accesorios)
- `metro` (decimal, hasta 2 decimales)
- `centímetro` (decimal, hasta 2 decimales, útil para cortes pequeños)

En toda la interfaz, la cantidad siempre se muestra junto a su unidad (ej. `2.50 m`, `35 cm`, `3 uds`), nunca como número aislado.

---

## 14. Fuentes y Referencias

- Design tokens definidos en `frontend/src/app/globals.css` via `@theme` (Tailwind v4 CSS-based config)
- Tipografía cargada en `frontend/src/app/layout.tsx` con `next/font/google`
- Sidebar: `frontend/src/components/Sidebar.tsx`
- Login: `frontend/src/app/login/page.tsx`
- Modal: `frontend/src/components/Modal.tsx`
- DateInput: `frontend/src/components/DateInput.tsx`
- QuantityInput (input de cantidad con unidad): `frontend/src/components/QuantityInput.tsx`
- ProductAutocomplete: `frontend/src/components/ProductAutocomplete.tsx`
- SalesForm (Nueva Venta): `frontend/src/features/sales/SalesForm.tsx`
- SalesList: `frontend/src/features/sales/SalesList.tsx`
- InventoryList: `frontend/src/features/inventory/InventoryList.tsx`
- ProviderList: `frontend/src/features/providers/ProviderList.tsx`
- PurchaseForm: `frontend/src/features/providers/PurchaseForm.tsx`
- FinanceView (Ingresos/Egresos): `frontend/src/features/finance/FinanceView.tsx`
- EmployeeList: `frontend/src/features/employees/EmployeeList.tsx`
- InvoiceList: `frontend/src/features/invoices/InvoiceList.tsx`
- Dashboard (Admin): `frontend/src/features/dashboard/DashboardAdminView.tsx`
- Dashboard (Empleado): `frontend/src/features/dashboard/DashboardEmployeeView.tsx`
- Invoice PDF service: `backend/src/modules/invoices/services/invoiceService.ts`
- Middleware de roles: `backend/src/middleware/requireRole.ts`

---

*Documento elaborado como base visual para el desarrollo del ERP de tubos, replicando el sistema de diseño usado en proyectos previos de la empresa con ajustes de paleta e iconografía propios de este nuevo dominio.*
