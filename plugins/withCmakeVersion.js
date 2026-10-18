/**
 * Expo-Config-Plugin: setzt für das App-Modul eine neuere CMake-Version aus dem Android-SDK.
 *
 * Standard wäre CMake 3.22.1 mit Ninja 1.10 – das scheitert unter Windows an Pfaden über
 * 260 Zeichen (React-Native-Codegen erzeugt sehr tiefe Ordner). 3.30.5 ist die Version, mit der
 * React Native selbst baut; Gradle lädt sie bei Bedarf automatisch herunter.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const CMAKE_VERSION = '3.30.5';
const MARKER = '// @tierchen cmake-version';

module.exports = function withCmakeVersion(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += `
${MARKER}
android {
    externalNativeBuild {
        cmake {
            version = findProperty('tierchen.cmakeVersion') ?: '${CMAKE_VERSION}'
        }
    }
}
`;
    }
    return cfg;
  });
};
