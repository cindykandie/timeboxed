const { withMainApplication } = require('expo/config-plugins');

// Keep native changes reproducible under Continuous Native Generation. RN TV
// 0.87 requires pointer dispatch for mouse hover; no TV launcher flags change.
module.exports = function withPointerEvents(config) {
  return withMainApplication(config, (mod) => {
    const marker = '// TimeBoxed: enable hardware pointer events.';
    if (!mod.modResults.contents.includes(marker)) {
      const anchor = /super\.onCreate\(\);?/;
      if (!anchor.test(mod.modResults.contents)) throw new Error('Cannot locate Android application startup for pointer events.');
      const suffix = mod.modResults.language === 'java' ? ';' : '';
      mod.modResults.contents = mod.modResults.contents.replace(anchor, (match) =>
        `${match}\n    ${marker}\n    com.facebook.react.config.ReactFeatureFlags.dispatchPointerEvents = true${suffix}`);
    }
    return mod;
  });
};
