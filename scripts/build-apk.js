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

// Java: Gradle braucht JDK 17+. Reihenfolge: JAVA_HOME (wenn neu genug), JDK von Android Studio, andere installierte JDKs
const MIN_JAVA = 17;
const javaBin = (dir) => path.join(dir, 'bin', win ? 'java.exe' : 'java');
function javaVersion(dir) {
  const r = spawnSync(javaBin(dir), ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)(?:\.(\d+))?/.exec(`${r.stderr}${r.stdout}`);
  if (!m) return 0;
  return m[1] === '1' ? Number(m[2]) : Number(m[1]); // "1.8" → 8
}
const subdirs = (dir) => {
  try {
    return fs.readdirSync(dir).map((d) => path.join(dir, d));
  } catch {
    return [];
  }
};
const pf = process.env.ProgramFiles || 'C:\\Program Files';
const lad = process.env.LOCALAPPDATA || '';
const javaCandidates = [
  process.env.JAVA_HOME,
  ...(win
    ? [
        path.join(pf, 'Android', 'Android Studio', 'jbr'),
        lad && path.join(lad, 'Programs', 'Android Studio', 'jbr'),
        ...subdirs(lad && path.join(lad, 'JetBrains', 'Toolbox', 'apps', 'AndroidStudio', 'ch-0')).map((d) => path.join(d, 'jbr')),
        ...['Microsoft', 'Eclipse Adoptium', 'Java', 'Zulu', 'Amazon Corretto', 'BellSoft'].flatMap((v) => subdirs(path.join(pf, v))),
      ]
    : mac
      ? ['/Applications/Android Studio.app/Contents/jbr/Contents/Home', ...subdirs('/Library/Java/JavaVirtualMachines').map((d) => path.join(d, 'Contents', 'Home'))]
      : ['/opt/android-studio/jbr', path.join(home, 'android-studio', 'jbr'), '/snap/android-studio/current/jbr', ...subdirs('/usr/lib/jvm')]),
].filter((d) => d && fs.existsSync(javaBin(d)));

let javaHome = null;
const tooOld = [];
for (const d of javaCandidates) {
  const v = javaVersion(d);
  if (v >= MIN_JAVA) {
    javaHome = d;
    break;
  }
  tooOld.push(`${d} (Java ${v || '?'})`);
}
if (!javaHome) {
  fail(
    `Kein Java ${MIN_JAVA} oder neuer gefunden.` +
      (tooOld.length ? `\n  Zu alt: ${tooOld.join(', ')}` : '') +
      '\n  Lösung: Android Studio installieren (bringt ein passendes Java mit) oder ein JDK 17/21 installieren.',
  );
}
if (process.env.JAVA_HOME && path.resolve(process.env.JAVA_HOME) !== path.resolve(javaHome)) {
  console.log(`Hinweis: JAVA_HOME (${process.env.JAVA_HOME}) ist zu alt – nehme stattdessen ${javaHome}`);
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

const env = { ...process.env, JAVA_HOME: javaHome, PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH}` };
console.log(`Java: ${javaHome} (Version ${javaVersion(javaHome)})`);
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
