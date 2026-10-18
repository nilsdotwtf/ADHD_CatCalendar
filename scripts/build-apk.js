#!/usr/bin/env node
/**
 * Baut eine installierbare Test-APK (Release, mit Debug-Schlüssel signiert).
 *
 *   npm run build            → nur arm64 (alle aktuellen Handys, deutlich schneller)
 *   npm run build -- --all   → alle Prozessor-Architekturen
 *
 *   npm run build -- --studio "D:\Pfad\Android Studio"   → Android Studio an eigenem Ort
 *   npm run build -- --sdk "D:\Pfad\Android\Sdk"         → Android-SDK an eigenem Ort
 *
 * Sucht Java 17+ (am liebsten das von Android Studio – auch in der Registry und auf
 * allen Laufwerken) und das Android-SDK selbst; fragt sonst einmal nach und merkt sich
 * die Pfade in .build-apk.json. Ergebnis: ./Tierchen.apk
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

if (!fs.existsSync(path.join(ANDROID, 'app', 'build.gradle'))) {
  fail('Ordner "android/" fehlt. Bist du auf dem richtigen Branch? (git pull)  Sonst: npx expo prebuild --platform android');
}
if (!fs.existsSync(path.join(ROOT, 'node_modules', 'react-native'))) {
  fail('node_modules fehlt – bitte zuerst "npm ci" (oder "npm install") ausführen.');
}

// Gemerkte Pfade (Android Studio / SDK), damit man sie nur einmal angeben muss – steht in .gitignore
const CONFIG = path.join(ROOT, '.build-apk.json');
const config = (() => {
  try {
    return JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  } catch {
    return {};
  }
})();
const saveConfig = () => fs.writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function ask(question) {
  if (!process.stdin.isTTY) return Promise.resolve('');
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim().replace(/^"(.*)"$/, '$1'));
    }),
  );
}

// Java: Gradle braucht JDK 17+
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
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(dir, d.name));
  } catch {
    return [];
  }
};

/**
 * Macht aus einer Pfadangabe ein JDK-Verzeichnis: akzeptiert den Android-Studio-Ordner, dessen bin-Ordner,
 * studio64.exe, den jbr-Ordner oder direkt ein JDK.
 */
function toJdk(p) {
  if (!p) return null;
  let dir = p.replace(/^"(.*)"$/, '$1').replace(/[\\/]+$/, '');
  if (/\.exe$/i.test(dir) || (fs.existsSync(dir) && fs.statSync(dir).isFile())) dir = path.dirname(dir);
  for (let i = 0; i < 4 && dir; i++) {
    if (fs.existsSync(javaBin(dir))) return dir;
    for (const sub of ['jbr', 'jre', path.join('jbr', 'Contents', 'Home')]) {
      if (fs.existsSync(javaBin(path.join(dir, sub)))) return path.join(dir, sub);
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

/** Windows: Installationsorte von Android Studio aus der Registry */
function studioFromRegistry() {
  if (!win) return [];
  const out = [];
  const roots = ['HKLM\\SOFTWARE', 'HKCU\\SOFTWARE', 'HKLM\\SOFTWARE\\WOW6432Node'];
  for (const r of roots) {
    for (const key of [`${r}\\Android Studio`, `${r}\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Android Studio`]) {
      const q = spawnSync('reg', ['query', key], { encoding: 'utf8' });
      if (q.status !== 0) continue;
      for (const m of q.stdout.matchAll(/^\s+(\S+)\s+REG_(?:EXPAND_)?SZ\s+(.+)$/gm)) {
        if (/^(Path|InstallLocation|DisplayIcon|UninstallString)$/i.test(m[1])) out.push(m[2].replace(/"/g, '').replace(/,\d+$/, '').trim());
      }
    }
  }
  return out;
}

/** Windows: Android Studio auf allen Laufwerken in üblichen Ordnern suchen */
function studioOnDrives() {
  if (!win) return [];
  const out = [];
  for (const letter of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
    const drive = `${letter}:\\`;
    if (!fs.existsSync(drive)) continue;
    for (const rel of ['Android Studio', 'Android\\Android Studio', 'Program Files\\Android\\Android Studio', 'Programme\\Android\\Android Studio', 'Programs\\Android Studio']) {
      out.push(path.join(drive, rel));
    }
    // eine Ebene tief: Ordner mit "android" oder "studio" im Namen (z. B. G:\Tools\AndroidStudio)
    for (const top of subdirs(drive)) {
      for (const d of [top, ...(/(tools|programs?|programme|dev|apps|software)/i.test(path.basename(top)) ? subdirs(top) : [])]) {
        if (/android|studio/i.test(path.basename(d))) out.push(d, ...subdirs(d).filter((x) => /studio/i.test(path.basename(x))));
      }
    }
  }
  return out;
}

const pf = process.env.ProgramFiles || 'C:\\Program Files';
const lad = process.env.LOCALAPPDATA || '';

function javaCandidates() {
  return [
    // 1. ausdrücklich angegeben bzw. gemerkt
    argValue('--studio'),
    argValue('--java'),
    process.env.ANDROID_STUDIO,
    config.java,
    // 2. JAVA_HOME
    process.env.JAVA_HOME,
    // 3. Android Studio (bringt passendes Java mit)
    ...(win
      ? [
          path.join(pf, 'Android', 'Android Studio'),
          lad && path.join(lad, 'Programs', 'Android Studio'),
          ...subdirs(lad && path.join(lad, 'JetBrains', 'Toolbox', 'apps', 'AndroidStudio', 'ch-0')),
          ...subdirs(lad && path.join(lad, 'Programs')).filter((d) => /android/i.test(d)),
          ...studioFromRegistry(),
          ...studioOnDrives(),
        ]
      : mac
        ? ['/Applications/Android Studio.app', path.join(home, 'Applications', 'Android Studio.app')]
        : ['/opt/android-studio', path.join(home, 'android-studio'), '/snap/android-studio/current']),
    // 4. sonstige installierte JDKs
    ...(win
      ? ['Microsoft', 'Eclipse Adoptium', 'Java', 'Zulu', 'Amazon Corretto', 'BellSoft'].flatMap((v) => subdirs(path.join(pf, v)))
      : mac
        ? subdirs('/Library/Java/JavaVirtualMachines').map((d) => path.join(d, 'Contents', 'Home'))
        : subdirs('/usr/lib/jvm')),
  ];
}

async function findJava() {
  const seen = new Set();
  const tooOld = [];
  for (const c of javaCandidates()) {
    const jdk = toJdk(c);
    if (!jdk || seen.has(path.resolve(jdk))) continue;
    seen.add(path.resolve(jdk));
    const v = javaVersion(jdk);
    if (v >= MIN_JAVA) return jdk;
    tooOld.push(`${jdk} (Java ${v || '?'})`);
  }
  if (tooOld.length) console.log(`Zu altes Java übersprungen: ${tooOld.join(', ')}`);
  // Nichts gefunden → einmal nachfragen und merken
  for (let tries = 0; tries < 3; tries++) {
    const answer = await ask(
      `\nAndroid Studio nicht gefunden. Wo ist es installiert?\n` +
        `  (Ordner von Android Studio, z. B. ${win ? 'D:\\Programme\\Android Studio' : '/opt/android-studio'} – oder ein JDK ${MIN_JAVA}+)\n> `,
    );
    if (!answer) break;
    const jdk = toJdk(answer);
    const v = jdk ? javaVersion(jdk) : 0;
    if (jdk && v >= MIN_JAVA) return jdk;
    console.log(jdk ? `Dort ist nur Java ${v} – es wird ${MIN_JAVA} oder neuer gebraucht.` : `In "${answer}" kein Java gefunden (erwartet: Unterordner "jbr").`);
  }
  fail(
    `Kein Java ${MIN_JAVA} oder neuer gefunden.\n` +
      `  Gib den Ordner von Android Studio direkt an:  npm run build -- --studio "D:\\Pfad\\zu\\Android Studio"`,
  );
}

async function findSdk() {
  const localProps = path.join(ANDROID, 'local.properties');
  if (fs.existsSync(localProps)) {
    const m = /^sdk\.dir=(.+)$/m.exec(fs.readFileSync(localProps, 'utf8'));
    if (m && fs.existsSync(m[1].replace(/\\:/g, ':').trim())) return;
  }
  const isSdk = (d) => Boolean(d) && (fs.existsSync(path.join(d, 'platforms')) || fs.existsSync(path.join(d, 'platform-tools')));
  let sdk = [
    argValue('--sdk'),
    config.sdk,
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    win && lad && path.join(lad, 'Android', 'Sdk'),
    mac && path.join(home, 'Library', 'Android', 'sdk'),
    !win && !mac && path.join(home, 'Android', 'Sdk'),
  ].find(isSdk);
  for (let tries = 0; !sdk && tries < 3; tries++) {
    const answer = await ask(
      `\nAndroid-SDK nicht gefunden. Wo liegt es?\n` +
        `  (steht in Android Studio unter Settings → Languages & Frameworks → Android SDK → "Android SDK Location")\n> `,
    );
    if (!answer) break;
    if (isSdk(answer)) {
      sdk = answer;
      config.sdk = answer;
      saveConfig();
    } else console.log(`"${answer}" sieht nicht nach einem Android-SDK aus (erwartet: Unterordner 'platforms').`);
  }
  if (!sdk) fail('Kein Android-SDK gefunden. Android Studio einmal öffnen (installiert das SDK) oder: npm run build -- --sdk "Pfad"');
  fs.writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '/')}\n`);
  console.log(`Android-SDK: ${sdk}`);
}

async function main() {
  const javaHome = await findJava();
  if (path.resolve(javaHome) !== path.resolve(config.java || '')) {
    config.java = javaHome;
    saveConfig();
  }
  if (process.env.JAVA_HOME && path.resolve(process.env.JAVA_HOME) !== path.resolve(javaHome)) {
    console.log(`Hinweis: JAVA_HOME (${process.env.JAVA_HOME}) wird nicht benutzt – nehme ${javaHome}`);
  }
  await findSdk();

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
}

main();
