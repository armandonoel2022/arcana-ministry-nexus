#!/usr/bin/env node
/**
 * Copia la configuración nativa de ARCANA (Info.plist, App.entitlements,
 * AppDelegate.swift) dentro del proyecto iOS generado por Capacitor y
 * registra el archivo de entitlements en project.pbxproj si hace falta.
 *
 * Uso:
 *   npx cap add ios      (solo la primera vez)
 *   node scripts/apply-ios-config.mjs
 *   npx cap sync ios
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const src = join(root, 'ios-config');
const dest = join(root, 'ios', 'App', 'App');
const pbxproj = join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

if (!existsSync(dest)) {
  console.error('❌ No existe ios/App/App. Ejecuta primero:  npx cap add ios');
  process.exit(1);
}

for (const file of ['Info.plist', 'App.entitlements', 'AppDelegate.swift']) {
  copyFileSync(join(src, file), join(dest, file));
  console.log(`✅ ${file} copiado a ios/App/App/`);
}

// Registrar CODE_SIGN_ENTITLEMENTS en el proyecto de Xcode
if (existsSync(pbxproj)) {
  let content = readFileSync(pbxproj, 'utf8');
  if (!content.includes('CODE_SIGN_ENTITLEMENTS')) {
    content = content.replace(
      /(\s+)(CODE_SIGN_STYLE = Automatic;)/g,
      '$1CODE_SIGN_ENTITLEMENTS = App/App.entitlements;$1$2'
    );
    writeFileSync(pbxproj, content);
    console.log('✅ CODE_SIGN_ENTITLEMENTS registrado en project.pbxproj');
  } else {
    console.log('ℹ️  CODE_SIGN_ENTITLEMENTS ya estaba configurado');
  }
}

console.log('\n👉 Ahora ejecuta:  npx cap sync ios');
console.log('👉 En Xcode: target App → Signing & Capabilities → añade "Push Notifications" y "Background Modes" (Remote notifications, Background fetch, Audio).');
console.log('👉 Para TestFlight: cambia aps-environment a "production" en ios-config/App.entitlements y el secreto APNS_PRODUCTION a true.');
