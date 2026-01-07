-- Actualizar rutas incorrectas en screen_permissions para que coincidan con App.tsx

-- Comunicación: /comunicacion -> /communication
UPDATE public.screen_permissions SET screen_path = '/communication' WHERE screen_path = '/comunicacion';

-- Grupos de Alabanza: /grupos -> /worship-groups
UPDATE public.screen_permissions SET screen_path = '/worship-groups' WHERE screen_path = '/grupos';

-- Acerca del Ministerio: /acerca -> /about
UPDATE public.screen_permissions SET screen_path = '/about' WHERE screen_path = '/acerca';

-- Configuración: /configuracion -> /settings
UPDATE public.screen_permissions SET screen_path = '/settings' WHERE screen_path = '/configuracion';

-- Estatutos: /estatutos -> /statutes
UPDATE public.screen_permissions SET screen_path = '/statutes' WHERE screen_path = '/estatutos';

-- Ensayos Colaborativos: /ensayos -> /rehearsals
UPDATE public.screen_permissions SET screen_path = '/rehearsals' WHERE screen_path = '/ensayos';

-- Eventos Especiales: /eventos -> /eventos-especiales
UPDATE public.screen_permissions SET screen_path = '/eventos-especiales' WHERE screen_path = '/eventos';

-- Reemplazos de Director: /reemplazos -> /director-replacements
UPDATE public.screen_permissions SET screen_path = '/director-replacements' WHERE screen_path = '/reemplazos';

-- Asistente Personal: /asistente -> /personal-assistant
UPDATE public.screen_permissions SET screen_path = '/personal-assistant' WHERE screen_path = '/asistente';

-- Módulo Espiritual: /espiritual -> /spiritual
UPDATE public.screen_permissions SET screen_path = '/spiritual' WHERE screen_path = '/espiritual';

-- Notificaciones Programadas: /notificaciones-programadas -> /scheduled-notifications
UPDATE public.screen_permissions SET screen_path = '/scheduled-notifications' WHERE screen_path = '/notificaciones-programadas';

-- Eliminar "Pruebas de Notificaciones" ya que fue eliminada
DELETE FROM public.screen_permissions WHERE screen_path = '/pruebas-notificaciones';