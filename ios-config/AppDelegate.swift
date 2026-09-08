import UIKit
import Capacitor
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        UNUserNotificationCenter.current().delegate = self
        requestNotificationPermissions(application)
        print("🚀 ARCANA AppDelegate inicializado")
        return true
    }

    // MARK: - Permisos

    private func requestNotificationPermissions(_ application: UIApplication) {
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
                if let error = error {
                    print("❌ Error solicitando permisos: \(error.localizedDescription)")
                    return
                }
                print("📱 Permiso de notificaciones: \(granted ? "concedido" : "denegado")")
                guard granted else { return }
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
    }

    // MARK: - Token APNs (CRÍTICO)

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {

        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("🔑 TOKEN APNs: \(token)")

        UserDefaults.standard.set(token, forKey: "apns_device_token")
        UserDefaults.standard.set(token, forKey: "pending_device_token_native")

        // Dispara el evento 'registration' del plugin de Capacitor
        NotificationCenter.default.post(
            name: NSNotification.Name.capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Error registrando push: \(error.localizedDescription)")
        NotificationCenter.default.post(
            name: NSNotification.Name.capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    // MARK: - Notificaciones remotas

    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        NotificationCenter.default.post(
            name: NSNotification.Name.capacitorDidReceiveRemoteNotification,
            object: userInfo
        )
        completionHandler(.newData)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .badge, .sound])
        } else {
            completionHandler([.alert, .badge, .sound])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        NotificationCenter.default.post(
            name: NSNotification.Name("PushNotificationActionPerformed"),
            object: nil,
            userInfo: response.notification.request.content.userInfo as? [String: Any]
        )
        completionHandler()
    }

    // MARK: - Deep links / URL

    func application(_ app: UIApplication, open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application,
                                                           continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }
}
