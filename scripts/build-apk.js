#!/usr/bin/env node
/**
 * Baut eine installierbare Test-APK (Release, mit Debug-Schlüssel signiert).
 *
 *   npm run build            → nur arm64 (alle aktuellen Handys, deutlich schneller)
 *   npm run build -- --all   → alle Prozessor-Architekturen
 *
 * Sucht Java (JDK von Android Studio) und das Android-SDK selbst, falls
 * JAVA_HOME / ANDROID_HOME nicht gesetzt sind. Ergebnis: ./Tierchen.apk
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const win = process.platform === 'win32';
const mac = process.platform === 'darwin';
const home = os.homedir();

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const firstExisting = (list) => list.filter(Boolean).find((p) => fs.existsSync(p));

if (!fs.existsSync(path.join(ANDROID, 'app', 'build.gradle'))) {
  fail('Ordner "android/" fehlt. Bist du auf dem richtigen Branch? (git pull)  Sonst: npx expo prebuild --platform android');
}
if (!fs.existsSync(path.join(ROOT, 'node_modules', 'react-native'))) {
  fail('node_modules fehlt – bitte zuerst "npm ci" (oder "npm install") ausführen.');
}

// Java: JAVA_HOME oder das JDK, das Android Studio mitbringt
const javaBin = (dir) => path.join(dir, 'bin', win ? 'java.exe' : 'java');
let javaHome = process.env.JAVA_HOME && fs.existsSync(javaBin(process.env.JAVA_HOME)) ? process.env.JAVA_HOME : null;
if (!javaHome) {
  const candidates = win
    ? [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr'),
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Android Studio', 'jbr'),
      ]
    : mac
      ? ['/Applications/Android Studio.app/Contents/jbr/Contents/Home']
      : ['/opt/android-studio/jbr', path.join(home, 'android-studio', 'jbr'), '/snap/android-studio/current/jbr'];
  javaHome = candidates.filter(Boolean).find((d) => fs.existsSync(javaBin(d))) || null;
}
if (!javaHome && spawnSync(win ? 'where' : 'which', ['java']).status !== 0) {
  fail('Kein Java gefunden. Android Studio installieren (bringt Java mit) oder JAVA_HOME auf ein JDK 17+ setzen.');
}

// Android-SDK: Umgebungsvariable, local.properties oder Standardordner von Android Studio
const localProps = path.join(ANDROID, 'local.properties');
const hasSdkDir = fs.existsSync(localProps) && /^sdk\.dir=/m.test(fs.readFileSync(localProps, 'utf8'));
if (!hasSdkDir) {
  const sdk = firstExisting([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    win && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    mac && path.join(home, 'Library', 'Android', 'sdk'),
    !win && !mac && path.join(home, 'Android', 'Sdk'),
  ]);
  if (!sdk) {
    fail('Kein Android-SDK gefunden. Android Studio einmal öffnen (SDK wird dabei installiert) oder ANDROID_HOME setzen.');
  }
  fs.writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '/')}\n`);
  console.log(`Android-SDK: ${sdk}`);
}

const args = ['assembleRelease'];
if (!process.argv.includes('--all')) args.push('-PreactNativeArchitectures=arm64-v8a');

const env = { ...process.env, ...(javaHome ? { JAVA_HOME: javaHome } : {}) };
if (javaHome) console.log(`Java: ${javaHome}`);
console.log(`\nBaue APK (${args.join(' ')}) – beim ersten Mal dauert das 10–20 Minuten …\n`);

const res = win
  ? spawnSync('gradlew.bat', args, { cwd: ANDROID, stdio: 'inherit', env, shell: true })
  : spawnSync('./gradlew', args, { cwd: ANDROID, stdio: 'inherit', env });
if (res.status !== 0) fail('Gradle-Build fehlgeschlagen – die Meldung oben zeigt den Grund.');

const apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(apk)) fail(`APK nicht gefunden: ${apk}`);
const out = path.join(ROOT, 'Tierchen.apk');
fs.copyFileSync(apk, out);
console.log(`\n✔ Fertig: ${out}\n  Aufs Handy kopieren und installieren („Installation aus unbekannten Quellen“ erlauben).\n`);
