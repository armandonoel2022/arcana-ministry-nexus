# Avisos y cinta de resultados para encuestas y votaciones

## Objetivo
Avisar a los integrantes cuando exista una encuesta o votación nueva, sin interrumpir el uso normal de ARCANA, y mostrar brevemente su progreso.

## Implementación
- Añadir un aviso global, compacto y no bloqueante, visible sobre cualquier pantalla.
- Mostrar el tipo, título, estado y acceso directo a **Encuestas** o **Votaciones**.
- Considerar “nuevo” cada registro abierto que el usuario todavía no haya atendido.
- Repetir el recordatorio como máximo dos veces por día, en dos franjas separadas, guardando el control por usuario y dispositivo.
- No mostrar avisos de encuestas cerradas o vencidas.
- Añadir una cinta superior o inferior durante 15 segundos con resultados resumidos: opciones, porcentajes y total de votos.
- Permitir cerrar el aviso inmediatamente; la cinta no bloqueará botones, desplazamiento ni navegación.
- Actualizar los resultados mientras la app esté abierta y limpiar correctamente la suscripción al salir.

## Ejemplo solicitado
- Mostrar una demostración de una sola vez en el dispositivo actual, usando una encuesta ficticia claramente marcada como ejemplo.
- El ejemplo no se guardará en la base de datos ni contará como una encuesta real.
- Después de cerrarse o completar sus 15 segundos, no volverá a mostrarse.

## Validación
- Comprobar el aviso y la cinta en la vista móvil actual.
- Confirmar que el acceso directo abre el módulo correspondiente.
- Confirmar que la app sigue siendo utilizable mientras pasa la cinta.
- Confirmar que el ejemplo solo aparece una vez y que el límite diario se conserva al recargar.
