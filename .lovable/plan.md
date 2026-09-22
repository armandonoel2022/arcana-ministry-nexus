# Encuestas y Votaciones

Dos módulos nuevos, anónimos, con creación/edición exclusiva para administradores y resultados visibles para todos.

## 1. Encuestas — `/encuestas`

Categorías fijas:
- Lugares para viajes
- Vestimenta para coristas
- Vestimenta para músicos
- Vestimenta para danzarinas
- Vestimenta para encargados de piso
- Vestimenta para camarógrafos

Cada encuesta tiene: título, descripción, categoría, fecha de cierre, estado (abierta/cerrada) y una lista de opciones.

Cada opción puede incluir:
- Texto (ej. "Punta Cana", "Traje azul marino")
- Estilo (texto libre: formal, casual, túnica…)
- Color (selector de color + nombre)
- Foto opcional (bucket `poll-photos`)

Selección simple o múltiple (lo define el administrador al crear).

Vista del integrante: tarjetas por categoría, votar una vez, y ver barras de progreso con porcentaje y total de votos. Tras cerrar, se marca el ganador.

## 2. Votaciones — `/votaciones`

Elección de integrantes para un cargo. El campo cargo es escribible: se elige de los cargos ya usados o se escribe uno nuevo.

Cada votación tiene: cargo, descripción, fecha de cierre, estado, y candidatos tomados de `members` (con foto y nombre). Un voto por persona.

Resultados en tiempo real con barras, conteo y ganador al cerrar.

## Anonimato

Los votos se guardan en tablas separadas del registro de participación:
- La tabla de votos guarda solo `poll_id` + `option_id` (sin usuario).
- Una tabla aparte `poll_participants` guarda `poll_id` + `user_id` solo para impedir votar dos veces.

Así nadie —ni un administrador— puede reconstruir quién votó qué.

## Base de datos

- `polls`: title, description, category, kind (`encuesta` | `votacion`), position_title, multiple_choice, closes_at, status, created_by
- `poll_options`: poll_id, label, style, color, photo_url, member_id, sort_order
- `poll_votes`: poll_id, option_id (anónimo)
- `poll_participants`: poll_id, user_id (único por encuesta)

Reglas de acceso:
- Todos los autenticados ven encuestas y resultados.
- Solo administradores crean, editan, cierran o eliminan.
- Registrar un voto valida por trigger que la encuesta esté abierta y no vencida.
- Nadie puede leer `poll_participants` de otros.

Cierre automático: al cargar la pantalla se marcan como cerradas las que ya pasaron su fecha; además un trigger bloquea votos vencidos.

## Detalles técnicos

- Nuevas rutas en `App.tsx` y filas en `screen_permissions` para que aparezcan en el menú lateral (categoría "Ministerio").
- Componentes: `src/pages/Polls.tsx`, `src/pages/Votings.tsx`, más `PollCard`, `PollForm`, `PollResults` en `src/components/polls/`.
- Fotos con la misma compresión ya usada en Mi Outfit e Inventario.
- Paleta navy/azul eléctrico de la app; fechas parseadas al mediodía local.
