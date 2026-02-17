const MAVEN_METADATA_URL =
  'https://repo.redlance.org/public/com/zigythebird/playeranim/PlayerAnimationLibCommon/maven-metadata.xml';

function parseVersions(xml) {
  const versionRegex = /<version>([^<]+)<\/version>/g;
  const versions = [];
  let match;

  while ((match = versionRegex.exec(xml)) !== null) {
    versions.push(match[1]);
  }

  // Group by MC version and pick the last published (latest in XML order)
  const byMc = {};
  for (const version of versions) {
    const mcMatch = version.match(/\+mc\.?(.+)$/);
    if (!mcMatch) continue;
    byMc[mcMatch[1]] = version;
  }

  return byMc;
}

module.exports = function mavenVersionsPlugin() {
  return {
    name: 'maven-versions-plugin',

    async loadContent() {
      try {
        const response = await fetch(MAVEN_METADATA_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        return parseVersions(xml);
      } catch (error) {
        console.warn('[maven-versions-plugin] Failed to fetch versions:', error);
        return {};
      }
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};
