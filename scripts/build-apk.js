#!/usr/bin/env node
/**
 * Baut eine installierbare Test-APK (Release, mit Debug-Schlüssel signiert).
 *
 *   npm run build            → nur arm64 (alle aktuellen Handys, deutlich schneller)
 *   npm run build -- --all   → alle Prozessor-Architekturen
 *
 *   npm run build -- --studio "D:\Pfad\Android Studio"   → Android Studio an eigenem Ort
 *   npm run build -- --sdk "D:\Pfad\Android\Sdk"         → Android-SDK an eigenem Ort
 *   npm run build -- --cmake 3.31.6                    → andere CMake-Version aus dem SDK
 *
 * Unter Windows prüft es außerdem, ob lange Dateipfade erlaubt sind (nötig für den C++-Teil),
 * und bietet an, sie einzuschalten.
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
function toJdk(p, { walkUp = false } = {}) {
  if (!p) return null;
  let dir = p.replace(/^"(.*)"$/, '$1').replace(/[\\/]+$/, '');
  if (!fs.existsSync(dir)) return null;
  if (fs.statSync(dir).isFile()) dir = path.dirname(dir);
  // nur bei ausdrücklich angegebenen Pfaden nach oben suchen (z. B. …\Android Studio\bin\studio64.exe)
  for (let i = 0; i < (walkUp ? 3 : 1); i++) {
    for (const sub of ['jbr', path.join('jbr', 'Contents', 'Home'), 'jre', '']) {
      const d = sub ? path.join(dir, sub) : dir;
      if (fs.existsSync(javaBin(d))) return d;
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
  const explicit = (p) => p && { p, walkUp: true };
  return [
    // 1. ausdrücklich angegeben bzw. gemerkt
    explicit(argValue('--studio')),
    explicit(argValue('--java')),
    explicit(process.env.ANDROID_STUDIO),
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
    const jdk = c && typeof c === 'object' ? toJdk(c.p, { walkUp: c.walkUp }) : toJdk(c);
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
    const jdk = toJdk(answer, { walkUp: true });
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
    const dir = m && m[1].replace(/\\:/g, ':').trim();
    if (dir && fs.existsSync(dir)) return dir;
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
  return sdk;
}

/** Setzt bzw. ersetzt einen Eintrag in android/local.properties */
function setLocalProp(key, value) {
  const file = path.join(ANDROID, 'local.properties');
  const lines = (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '').split(/\r?\n/).filter((l) => l && !l.startsWith(`${key}=`));
  lines.push(`${key}=${value.replace(/\\/g, '/')}`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

/**
 * Stellt sicher, dass die gewünschte CMake-Version im SDK liegt. Gradle lädt von sich aus nur die
 * Standardversion (3.22.1) – deshalb hier: erst sdkmanager versuchen, sonst direkt aus dem
 * offiziellen SDK-Verzeichnis von Google laden (wie der SDK-Manager von Android Studio).
 */
const SDK_REPO = process.env.TIERCHEN_SDK_REPO || 'https://dl.google.com/android/repository';
const cmakeExe = (dir) => path.join(dir, 'bin', win ? 'cmake.exe' : 'cmake');
const vnum = (v) => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0);

async function ensureCmake(sdk, wanted) {
  const target = (v) => path.join(sdk, 'cmake', v);
  if (fs.existsSync(cmakeExe(target(wanted)))) return { version: wanted, dir: target(wanted) };

  // 1. sdkmanager (falls die "Android SDK Command-line Tools" installiert sind)
  const sdkmanager = subdirs(path.join(sdk, 'cmdline-tools'))
    .map((d) => path.join(d, 'bin', win ? 'sdkmanager.bat' : 'sdkmanager'))
    .find((f) => fs.existsSync(f));
  if (sdkmanager) {
    console.log(`Installiere CMake ${wanted} mit dem sdkmanager …`);
    spawnSync(sdkmanager, ['--install', `cmake;${wanted}`], { input: 'y\ny\ny\n', stdio: ['pipe', 'inherit', 'inherit'], shell: win });
    if (fs.existsSync(cmakeExe(target(wanted)))) return { version: wanted, dir: target(wanted) };
  }

  // 2. direkt aus dem SDK-Verzeichnis
  console.log(`Lade CMake ${wanted} aus dem Android-SDK-Verzeichnis …`);
  let xml;
  try {
    const r = await fetch(`${SDK_REPO}/repository2-3.xml`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    xml = await r.text();
  } catch (e) {
    return cmakeHelp(wanted, `Das SDK-Verzeichnis war nicht erreichbar (${e.message}).`);
  }
  const host = win ? 'windows' : mac ? 'macosx' : 'linux';
  const packages = [...xml.matchAll(/<remotePackage path="cmake;([\d.]+)">([\s\S]*?)<\/remotePackage>/g)]
    .map(([, version, body]) => {
      const archives = [...body.matchAll(/<archive>([\s\S]*?)<\/archive>/g)].map(([, a]) => ({
        url: (/<url>([^<]+)<\/url>/.exec(a) || [])[1],
        sha1: (/<checksum type="sha1">([^<]+)<\/checksum>/.exec(a) || [])[1],
        os: (/<host-os>([^<]+)<\/host-os>/.exec(a) || [])[1],
      }));
      return { version, archive: archives.find((a) => a.os === host) || archives.find((a) => !a.os) };
    })
    .filter((p) => p.archive && p.archive.url);
  // gewünschte Version – sonst die neueste ab 3.30 (ältere scheitern an langen Pfaden)
  const pkg =
    packages.find((p) => p.version === wanted) ||
    packages.filter((p) => vnum(p.version) >= vnum('3.30.0')).sort((a, b) => vnum(b.version) - vnum(a.version))[0];
  if (!pkg) return cmakeHelp(wanted, 'Im SDK-Verzeichnis gibt es keine passende CMake-Version.');
  if (fs.existsSync(cmakeExe(target(pkg.version)))) return { version: pkg.version, dir: target(pkg.version) };

  const url = /^https?:/.test(pkg.archive.url) ? pkg.archive.url : `${SDK_REPO}/${pkg.archive.url}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tierchen-cmake-'));
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (pkg.archive.sha1 && require('crypto').createHash('sha1').update(buf).digest('hex') !== pkg.archive.sha1) {
      throw new Error('Prüfsumme stimmt nicht');
    }
    const zip = path.join(tmp, 'cmake.zip');
    fs.writeFileSync(zip, buf);
    const out = path.join(tmp, 'x');
    fs.mkdirSync(out);
    // Windows 10+ bringt tar mit (kann zip), sonst unzip
    const ex = win ? spawnSync('tar', ['-xf', zip, '-C', out]) : spawnSync('unzip', ['-q', zip, '-d', out]);
    if (ex.status !== 0) throw new Error('Entpacken fehlgeschlagen');
    // Ordner mit bin/cmake finden (Archiv kann einen Oberordner haben)
    const find = (d, depth = 0) => (fs.existsSync(cmakeExe(d)) ? d : depth < 2 ? subdirs(d).map((x) => find(x, depth + 1)).find(Boolean) : null);
    const root = find(out);
    if (!root) throw new Error('im Archiv kein bin/cmake gefunden');
    fs.mkdirSync(path.dirname(target(pkg.version)), { recursive: true });
    fs.cpSync(root, target(pkg.version), { recursive: true });
    if (!win) {
      const bin = path.join(target(pkg.version), 'bin');
      for (const f of fs.readdirSync(bin)) fs.chmodSync(path.join(bin, f), 0o755);
    }
  } catch (e) {
    return cmakeHelp(pkg.version, `Download von CMake ${pkg.version} fehlgeschlagen (${e.message}).`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`✔ CMake ${pkg.version} installiert: ${target(pkg.version)}`);
  return { version: pkg.version, dir: target(pkg.version) };
}

function cmakeHelp(version, reason) {
  fail(
    `${reason}\n` +
      `  Bitte einmal in Android Studio installieren: Settings → Languages & Frameworks → Android SDK →\n` +
      `  Reiter "SDK Tools" → unten "Show Package Details" anhaken → unter "CMake" die Version ${version} → OK.\n` +
      `  Danach "npm run build" erneut starten.`,
  );
}

/**
 * Windows: React-Native-Codegen erzeugt Pfade über 260 Zeichen. Dafür muss Windows lange Pfade
 * erlauben (einmalige Einstellung, braucht Admin-Rechte) – Ninja aus CMake 3.30 kann sie dann nutzen.
 */
const LONG_PATHS_KEY = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem';
const longPathsOn = () =>
  /LongPathsEnabled\s+REG_DWORD\s+0x1\b/.test(spawnSync('reg', ['query', LONG_PATHS_KEY, '/v', 'LongPathsEnabled'], { encoding: 'utf8' }).stdout || '');

async function ensureLongPaths() {
  if (!win || longPathsOn()) return;
  const manual =
    '  Manuell: PowerShell als Administrator öffnen und ausführen:\n' +
    `    reg add ${LONG_PATHS_KEY} /v LongPathsEnabled /t REG_DWORD /d 1 /f\n` +
    '  Danach "npm run build" erneut starten (notfalls vorher den PC neu starten).';
  console.log(
    '\nWindows erlaubt auf diesem PC keine langen Dateipfade (über 260 Zeichen).\n' +
      'Die braucht der Android-Build aber – ohne scheitert er mit "ninja: error: mkdir … No such file or directory".',
  );
  const answer = (await ask('Jetzt einschalten? Windows fragt dann einmal nach Admin-Rechten. [J/n] ')).toLowerCase();
  if (answer.startsWith('n')) fail(`Ohne lange Pfade klappt der Build nicht.\n${manual}`);
  spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Start-Process reg -Verb RunAs -Wait -ArgumentList 'add','${LONG_PATHS_KEY}','/v','LongPathsEnabled','/t','REG_DWORD','/d','1','/f'`,
    ],
    { stdio: 'inherit' },
  );
  if (!longPathsOn()) fail(`Lange Pfade konnten nicht eingeschaltet werden.\n${manual}`);
  console.log('✔ Lange Pfade sind jetzt erlaubt.');
}

/** Reste eines C++-Builds mit anderer CMake-Version wegräumen (sonst bleibt der alte Fehler hängen) */
function cleanStaleCxx() {
  const gradle = fs.readFileSync(path.join(ANDROID, 'app', 'build.gradle'), 'utf8');
  const cmake = argValue('--cmake') || (/tierchen\.cmakeVersion'\) \?: '([\d.]+)'/.exec(gradle) || [])[1] || 'default';
  if (config.cmake === cmake) return cmake;
  for (const dir of [path.join(ANDROID, 'app', '.cxx'), path.join(ANDROID, 'app', 'build', 'intermediates', 'cxx')]) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  config.cmake = cmake;
  saveConfig();
  return cmake;
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
  const sdk = await findSdk();
  await ensureLongPaths();
  const wanted = cleanStaleCxx();
  const cmake = wanted === 'default' ? null : await ensureCmake(sdk, wanted);
  if (cmake) {
    setLocalProp('cmake.dir', cmake.dir);
    console.log(`CMake: ${cmake.version} (${cmake.dir})`);
  }

  const args = ['assembleRelease'];
  if (!process.argv.includes('--all')) args.push('-PreactNativeArchitectures=arm64-v8a');
  if (cmake && (argValue('--cmake') || cmake.version !== wanted)) args.push(`-Ptierchen.cmakeVersion=${cmake.version}`);

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
