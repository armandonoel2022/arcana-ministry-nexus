# Info.plist final para ARCANA (iOS / TestFlight)

Reemplaza `ios/App/App/Info.plist` con este contenido.

## Cambios respecto al tuyo

| Clave | Acción | Motivo |
|---|---|---|
| `NSPhotoLibraryAddUsageDescription` | **AGREGADA** | Sin ella la app **crashea** al guardar imágenes desde la hoja de compartir (descarga de overlays). |
| `UIBackgroundModes > push-to-talk` | **ELIMINADA** | Requiere el entitlement especial `com.apple.developer.push-to-talk` de Apple. Sin él, TestFlight rechaza el build. |
| `UIBackgroundModes > processing` | **ELIMINADA** | Requiere además `BGTaskSchedulerPermittedIdentifiers`; sin eso Apple lo marca como uso indebido. |
| `UNAuthorizationOptions`, `UNUserNotificationCenter`, `NSUserNotificationsUsageDescription` | **ELIMINADAS** | No son claves válidas de Info.plist en iOS. No hacen nada y ensucian la validación. Los permisos se piden en runtime. |
| `UIRequiredDeviceCapabilities > armv7` | **ELIMINADA** | armv7 es de 32 bits; iOS 13+ es solo arm64. Puede impedir la instalación. |
| `UIMainStoryboardFile` | **ELIMINADA** | Capacitor no usa `Main.storyboard`; solo `LaunchScreen`. |
| `ITSAppUsesNonExemptEncryption` | **AGREGADA** (`false`) | Evita el cuestionario de exportación en cada subida a TestFlight. |

## Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>es</string>
	<key>CFBundleDisplayName</key>
	<string>ARCANA</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(MARKETING_VERSION)</string>
	<key>CFBundleVersion</key>
	<string>$(CURRENT_PROJECT_VERSION)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>

	<!-- Permisos -->
	<key>NSCameraUsageDescription</key>
	<string>ARCANA necesita la cámara para tomar fotos de outfits, inventario y compartirlas en el chat del ministerio.</string>
	<key>NSMicrophoneUsageDescription</key>
	<string>ARCANA necesita el micrófono para grabar notas de voz y participar en los ensayos del ministerio.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>ARCANA necesita acceso a tus fotos para compartir imágenes en el chat y en los módulos del ministerio.</string>
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>ARCANA guarda en tu carrete las imágenes de los programas de servicio, turnos y tarjetas del ministerio.</string>
	<key>NSFaceIDUsageDescription</key>
	<string>ARCANA usa Face ID para que puedas iniciar sesión de forma rápida y segura.</string>

	<!-- Notificaciones push + audio en segundo plano -->
	<key>UIBackgroundModes</key>
	<array>
		<string>remote-notification</string>
		<string>fetch</string>
		<string>audio</string>
	</array>

	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
</dict>
</plist>
```

## Entitlements (esto es lo que realmente activa las push)

`aps-environment` **no va en Info.plist**, va en `ios/App/App/App.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>development</string>
</dict>
</plist>
```

- `development` → build desde Xcode a tu iPhone. Requiere `APNS_PRODUCTION = false`.
- `production` → TestFlight y App Store. **TestFlight usa APNs de producción**, así que al subir a TestFlight debes cambiar el secreto `APNS_PRODUCTION` a `true`.

En Xcode: target **App** → **Signing & Capabilities** → `+ Capability` → **Push Notifications** y **Background Modes** (marcar *Remote notifications*, *Background fetch*, *Audio*).

## Checklist antes de TestFlight

1. `git pull` del repo actualizado.
2. `npm install`
3. `npm run build`
4. `npx cap sync ios`
5. Xcode → Push Notifications + Background Modes activados.
6. Secretos en Supabase: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_TOPIC = do.com.arcana.app`, `APNS_PRODUCTION` (`false` en Xcode directo, `true` en TestFlight).
7. Iniciar sesión en la app → Configuración → verificar que aparezca "Token registrado".
