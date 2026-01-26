# iOS Info.plist - Configuración para Compartir en Redes Sociales

Para permitir que la app comparta contenido a WhatsApp, Instagram, Facebook y otras apps, debes agregar los siguientes esquemas de URL al archivo `ios/App/App/Info.plist`:

## LSApplicationQueriesSchemes

Agrega esto dentro del `<dict>` principal:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <!-- WhatsApp -->
    <string>whatsapp</string>
    <string>whatsapp-private</string>
    
    <!-- Instagram -->
    <string>instagram</string>
    <string>instagram-stories</string>
    
    <!-- Facebook -->
    <string>fb</string>
    <string>fb-messenger</string>
    <string>fbapi</string>
    <string>fbauth2</string>
    <string>fbshareextension</string>
    
    <!-- Telegram -->
    <string>telegram</string>
    <string>tg</string>
    
    <!-- Twitter/X -->
    <string>twitter</string>
    <string>x</string>
    
    <!-- iMessage / SMS -->
    <string>sms</string>
    <string>imessage</string>
    
    <!-- Email -->
    <string>mailto</string>
</array>
```

## Info.plist Completo Actualizado

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>ArcanaApp</string>
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
    
    <!-- URL Schemes para compartir en redes sociales -->
    <key>LSApplicationQueriesSchemes</key>
    <array>
        <string>whatsapp</string>
        <string>whatsapp-private</string>
        <string>instagram</string>
        <string>instagram-stories</string>
        <string>fb</string>
        <string>fb-messenger</string>
        <string>fbapi</string>
        <string>fbauth2</string>
        <string>fbshareextension</string>
        <string>telegram</string>
        <string>tg</string>
        <string>twitter</string>
        <string>x</string>
        <string>sms</string>
        <string>imessage</string>
        <string>mailto</string>
    </array>
    
    <key>NSCameraUsageDescription</key>
    <string>ArcanaApp necesita acceso a la cámara para tomar fotos y compartirlas en el chat.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>ArcanaApp necesita acceso al micrófono para grabar mensajes de voz en el chat.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>ArcanaApp necesita acceso a tus fotos para compartir imágenes en el chat.</string>
    <key>NSUserNotificationsUsageDescription</key>
    <string>Recibe zumbidos, avisos y notificaciones del chat del ministerio.</string>
    
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
        <string>audio</string>
        <string>fetch</string>
        <string>processing</string>
    </array>
    
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIMainStoryboardFile</key>
    <string>Main</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
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
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>
    <key>UNAuthorizationOptions</key>
    <array>
        <string>alert</string>
        <string>sound</string>
        <string>badge</string>
        <string>criticalAlert</string>
    </array>
    <key>UNUserNotificationCenter</key>
    <true/>
</dict>
</plist>
```

## Notas Importantes

1. **Web Share API**: La app ahora usa el Web Share API nativo que iOS soporta completamente. Esto permite compartir a cualquier app instalada sin necesidad de código específico para cada red social.

2. **LSApplicationQueriesSchemes**: Estos esquemas son necesarios si en el futuro quieres verificar si una app específica está instalada usando `canOpenURL()`.

3. **Capacitor Share Plugin** (Opcional): Si necesitas más control, puedes instalar `@capacitor/share`:
   ```bash
   npm install @capacitor/share
   npx cap sync
   ```

4. **Después de editar Info.plist**: Recuerda hacer `npx cap sync ios` para sincronizar los cambios.
