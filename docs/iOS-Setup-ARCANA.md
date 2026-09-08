# ARCANA — Preparar el proyecto iOS (push nativas + descargas)

Toda la configuración nativa vive en la carpeta `ios-config/` del repositorio y se
copia automáticamente al proyecto de Xcode. Ya no hay que pegar nada a mano.

| Archivo | Qué resuelve |
|---|---|
| `ios-config/AppDelegate.swift` | Incluye `didRegisterForRemoteNotificationsWithDeviceToken` → el token de APNs llega a JavaScript |
| `ios-config/Info.plist` | Incluye `NSPhotoLibraryAddUsageDescription` (evita el crash al descargar imágenes), background modes correctos y **sin** `push-to-talk` |
| `ios-config/App.entitlements` | Define `aps-environment` → activa las push en iOS |

## Pasos

```bash
git pull
npm install
npx cap add ios          # solo la primera vez
npm run ios:prepare      # build + copia config + cap sync
npx cap open ios
```

En Xcode, target **App** → **Signing & Capabilities**:
- `+ Capability` → **Push Notifications**
- `+ Capability` → **Background Modes** → marcar *Remote notifications*, *Background fetch*, *Audio*
- Verificar que **Code Signing Entitlements** apunte a `App/App.entitlements`

Si vuelves a ejecutar `npx cap add ios` o Capacitor regenera archivos, basta con
`npm run ios:config` para restaurar la configuración.

## TestFlight

TestFlight usa APNs de **producción**:
1. En `ios-config/App.entitlements` cambia `development` → `production`.
2. `npm run ios:config`
3. En Supabase, pon el secreto `APNS_PRODUCTION` en `true`.

Secretos requeridos en Supabase: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`,
`APNS_TOPIC = do.com.arcana.app`, `APNS_PRODUCTION`.

## Verificación en el iPhone

Abre la app → **Configuración → Notificaciones Push** → debe decir **"Token registrado"**.
Si no, toca **Re-registrar dispositivo** y revisa la consola de Xcode: debe imprimirse `🔑 TOKEN APNs: ...`.
