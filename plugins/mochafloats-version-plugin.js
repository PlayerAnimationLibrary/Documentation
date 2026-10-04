const MAVEN_METADATA_URL =
  'https://repo.redlance.org/public/org/redlance/mochafloats/runtime/maven-metadata.xml';

module.exports = function mochafloatsVersionPlugin() {
  return {
    name: 'mochafloats-version-plugin',

    async loadContent() {
      try {
        const response = await fetch(MAVEN_METADATA_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        const release = xml.match(/<release>([^<]+)<\/release>/);
        return {release: release ? release[1] : null};
      } catch (error) {
        console.warn('[mochafloats-version-plugin] Failed to fetch the version:', error);
        return {release: null};
      }
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};
