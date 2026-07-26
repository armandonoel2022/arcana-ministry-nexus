
# Nuevos módulos: Inventario y Finanzas

Dos módulos nuevos, ambos con control por rol (admin/líder de departamento) y visibilidad segmentada por departamento.

## 1. Módulo Inventario

Ruta: `/inventario` (categoría "Ministerio")

**Departamentos (categorías fijas)**
- Voces y Sonido (micrófonos, in-ears, monitores, cables, power cords, consolas, tablets, bocinas, plantas de bajo, etc.)
- Instrumentos musicales (piano, guitarras, batería, viento, pedales, atriles, etc.)
- Multimedia (computadoras, cámaras, luces, proyectores, etc.)
- Danza (panderos, streamers, abanicos, banderas, mantos, aros de lluvia, hoop de gloria, alas, etc.)

**Por cada ítem**
- Nombre, tipo/subcategoría (texto libre), foto (bucket público `inventory-photos`)
- Estado: `in_stock` | `assigned` | `loaned` | `damaged` | `retired`
- Asignado a: miembro (fk `members`) o líder o "stock" o "prestado a: <texto>"
- Fecha adquisición, costo, vida útil (meses) → depreciación calculada
- Notas
- Botón "Solicitar reemplazo/reparación" → crea notificación a administradores

**Tablas**
- `inventory_items`: department, subcategory, name, photo_url, status, assigned_member_id, loaned_to, acquisition_date, acquisition_cost, useful_life_months, notes, created_by
- `inventory_replacement_requests`: item_id, requested_by, reason, priority, status (pending/approved/rejected/completed), admin_response

**Permisos**
- Admin: todo
- Líder de departamento: ve y edita solo su departamento
- Miembro: solo lectura de lo asignado a él

## 2. Módulo Finanzas

Ruta: `/finanzas` (categoría "Administración Avanzada")

**Ingresos**
- Ofrendas / donaciones con fecha, monto, método (`efectivo` | `transferencia` | `electronico`), descripción, donante (opcional)

**Actividades / campañas de recaudación**
- Título (ej. "Campamento 2026"), meta, fecha límite
- Alcance: `todos` | `sin_directiva` | `por_grupo` (worship_group) | `por_departamento`
- Contribuciones por miembro (abonos incrementales), progreso vs meta
- Visibilidad: solo admins + líder del grupo/departamento asignado

**Tablas**
- `finance_income`: date, amount, method, description, donor, category
- `finance_campaigns`: title, goal_amount, deadline, scope, group_id, department, visible_to (array de user_ids opcional), created_by
- `finance_contributions`: campaign_id, member_id, amount, date, note, recorded_by

**Permisos**
- Admin: todo
- Líder: solo campañas de su grupo/departamento
- Miembros: pueden ver monto propio aportado en campañas donde participan (opcional)

## Detalles técnicos

- Storage bucket público `inventory-photos` (compresión al subir, ya tenemos patrón en `MiOutfit`)
- Cálculo de depreciación en frontend: `valor_actual = costo * max(0, 1 - meses_transcurridos/vida_util)`
- Nuevas rutas registradas en `App.tsx` y entradas en `screen_permissions` para que aparezcan en el sidebar según rol
- Filtro por departamento con tabs y grid tipo card con foto grande
- Exportación CSV de ambos módulos (patrón ya usado en repertorio)

## Confirmaciones antes de construir

1. ¿Los "líderes de departamento" son los mismos `lider` del sistema de roles actuales, o hay que crear un mapping departamento→líder?
2. Para finanzas ¿quieres que los miembros vean el progreso global de la campaña o solo lo que ellos han aportado?
3. ¿Adjuntar comprobantes de pago (foto) en ofrendas/contribuciones?
4. ¿Empiezo por Inventario y luego Finanzas, o los hago en paralelo en una sola tanda?
