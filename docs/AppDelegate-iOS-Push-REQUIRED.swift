// ============================================================
// ARCANA - AppDelegate.swift REQUERIDO para Push Notifications
// ============================================================
// 
// ⚠️ IMPORTANTE: Este archivo DEBE reemplazar el contenido de tu
// AppDelegate.swift en Xcode (ios/App/App/AppDelegate.swift)
//
// Sin esta configuración, los dispositivos iOS NO recibirán
// el token de APNs y las push notifications no funcionarán.
//
// ============================================================

import UIKit
import Capacitor
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    var window: UIWindow?
    
    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configurar el delegate de notificaciones
        UNUserNotificationCenter.current().delegate = self
        
        // Solicitar permisos de notificaciones al iniciar
        requestNotificationPermissions(application)
        
        print("🚀 ARCANA AppDelegate inicializado")
        
        return true
    }
    
    // MARK: - Solicitar Permisos de Notificaciones
    
    private func requestNotificationPermissions(_ application: UIApplication) {
        let center = UNUserNotificationCenter.current()
        
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            print("📱 Permiso de notificaciones: \(granted ? "✅ Concedido" : "❌ Denegado")")
            
            if let error = error {
                print("❌ Error solicitando permisos: \(error.localizedDescription)")
                return
            }
            
            if granted {
                DispatchQueue.main.async {
                    // CRÍTICO: Registrar para notificaciones remotas
                    application.registerForRemoteNotifications()
                    print("📱 Registrando para notificaciones remotas...")
                }
            }
        }
    }
    
    // ============================================================
    // MARK: - 🔑 REGISTRO EXITOSO - RECIBIR TOKEN DE APNs
    // ============================================================
    // Este método es CRÍTICO - sin él, el token nunca llega a JavaScript
    
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        
        // 1. Convertir token binario a string hexadecimal
        let tokenParts = deviceToken.map { String(format: "%02.2hhx", $0) }
        let token = tokenParts.joined()
        
        print("🔑 ============================================")
        print("🔑 TOKEN DE APNs RECIBIDO:")
        print("🔑 \(token)")
        print("🔑 ============================================")
        
        // 2. Guardar en UserDefaults para que JavaScript pueda leerlo
        UserDefaults.standard.set(token, forKey: "apns_device_token")
        UserDefaults.standard.set(token, forKey: "pending_device_token_native")
        UserDefaults.standard.synchronize()
        print("💾 Token guardado en UserDefaults")
        
        // 3. CRÍTICO: Notificar a Capacitor del token
        // Esto dispara el evento 'registration' en JavaScript
        NotificationCenter.default.post(
            name: NSNotification.Name.capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
        print("📤 Token enviado a Capacitor via NotificationCenter")
        
        // 4. También intentar enviar directamente al plugin de Capacitor
        // Esto es un fallback por si NotificationCenter no funciona
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            // Post a custom notification that our JS code can listen to
            NotificationCenter.default.post(
                name: NSNotification.Name("PushTokenReceived"),
                object: nil,
                userInfo: ["token": token]
            )
        }
    }
    
    // ============================================================
    // MARK: - ❌ ERROR EN REGISTRO
    // ============================================================
    
    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        
        print("❌ ============================================")
        print("❌ ERROR REGISTRANDO PARA PUSH:")
        print("❌ \(error.localizedDescription)")
        print("❌ ============================================")
        
        // Notificar a Capacitor del error
        NotificationCenter.default.post(
            name: NSNotification.Name.capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }
    
    // ============================================================
    // MARK: - 📬 NOTIFICACIÓN RECIBIDA EN FOREGROUND
    // ============================================================
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        let userInfo = notification.request.content.userInfo
        print("📬 Push recibida en foreground: \(userInfo)")
        
        // Mostrar la notificación incluso cuando la app está abierta
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .badge, .sound])
        } else {
            completionHandler([.alert, .badge, .sound])
        }
    }
    
    // ============================================================
    // MARK: - 👆 USUARIO TOCÓ LA NOTIFICACIÓN
    // ============================================================
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let userInfo = response.notification.request.content.userInfo
        print("👆 Usuario tocó notificación: \(userInfo)")
        
        // Notificar a Capacitor para que maneje la acción
        NotificationCenter.default.post(
            name: NSNotification.Name("PushNotificationActionPerformed"),
            object: nil,
            userInfo: userInfo as? [String: Any]
        )
        
        completionHandler()
    }
    
    // ============================================================
    // MARK: - 📱 NOTIFICACIÓN SILENCIOSA / BACKGROUND
    // ============================================================
    
    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        
        print("📱 Push silenciosa/background: \(userInfo)")
        completionHandler(.newData)
    }
    
    // ============================================================
    // MARK: - UISceneSession Lifecycle (iOS 13+)
    // ============================================================
    
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    func application(_ application: UIApplication,
                     didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }
}

// ============================================================
// EXTENSIÓN: Nombres de notificaciones de Capacitor
// ============================================================
// Estas extensiones aseguran compatibilidad con Capacitor

extension NSNotification.Name {
    static let capacitorDidRegisterForRemoteNotifications = 
        NSNotification.Name("CapacitorDidRegisterForRemoteNotifications")
    static let capacitorDidFailToRegisterForRemoteNotifications = 
        NSNotification.Name("CapacitorDidFailToRegisterForRemoteNotifications")
}
