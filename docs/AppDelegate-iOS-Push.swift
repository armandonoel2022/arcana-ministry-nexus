// AppDelegate.swift - Configuración de Push Notifications para iOS
// Este archivo debe ser modificado manualmente en Xcode
// Ubicación: ios/App/App/AppDelegate.swift

/*
 * INSTRUCCIONES DE IMPLEMENTACIÓN:
 * 
 * 1. Abre tu proyecto iOS en Xcode (ios/App/App.xcworkspace)
 * 2. Navega a AppDelegate.swift
 * 3. Reemplaza el contenido con el código de abajo
 * 4. Actualiza las constantes supabaseUrl y supabaseKey con tus valores
 * 5. Compila y ejecuta la app
 */

import UIKit
import Capacitor
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    
    // ⚠️ IMPORTANTE: Actualiza estos valores con tu proyecto Supabase
    let supabaseUrl = "https://hfjtzmnphyizntcjzgar.supabase.co"
    let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg"

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configurar push notifications
        configurePushNotifications(application)
        
        return true
    }
    
    // MARK: - Push Notifications Configuration
    
    func configurePushNotifications(_ application: UIApplication) {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        
        // Solicitar autorización para notificaciones
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ Permisos de push notification concedidos")
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            } else {
                print("❌ Permisos de push notification denegados")
                if let error = error {
                    print("Error: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // Handle device token registration
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Convertir token a string hexadecimal
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        print("📱 Device Token recibido: \(token)")
        
        // IMPORTANTE: El token se guarda en JavaScript cuando el usuario se autentica
        // El AppDelegate solo pasa el token a Capacitor, NO directamente a Supabase
        // porque no tenemos acceso al user_id desde el código nativo
        
        // Pasar a Capacitor para que lo maneje con el contexto del usuario
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
        
        // También guardar en UserDefaults para que JavaScript pueda recuperarlo
        UserDefaults.standard.set(token, forKey: "pending_device_token_native")
        print("💾 Token guardado en UserDefaults para JavaScript")
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Error registrando para notificaciones remotas: \(error.localizedDescription)")
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }
    
    // NOTA: El guardado del token en Supabase se hace desde JavaScript (usePushNotifications)
    // porque necesitamos el user_id del usuario autenticado, que no está disponible en Swift.
    // El token se pasa a Capacitor mediante NotificationCenter y se guarda en localStorage
    // para que JavaScript lo procese cuando el usuario se autentique.
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // Manejar notificaciones cuando la app está en primer plano
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                                willPresent notification: UNNotification, 
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        print("📱 Notificación recibida en primer plano: \(notification.request.content.title)")
        
        // Mostrar banner, sonido y badge incluso en primer plano
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    // Manejar tap en notificación
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                                didReceive response: UNNotificationResponse, 
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        print("📱 Usuario tocó notificación: \(userInfo)")
        
        // Pasar a Capacitor para manejar la navegación
        NotificationCenter.default.post(
            name: NSNotification.Name("capacitorDidReceiveRemoteNotification"),
            object: userInfo
        )
        
        completionHandler()
    }
    
    // MARK: - UISceneSession Lifecycle (iOS 13+)

    func application(_ application: UIApplication, 
                     configurationForConnecting connectingSceneSession: UISceneSession, 
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
    }
}
