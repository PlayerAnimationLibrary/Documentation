import React from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';

export default function MavenVersion({mcVersion}: {mcVersion: string}) {
  const versions = usePluginData('maven-versions-plugin') as Record<string, string> | undefined;
  const version = versions?.[mcVersion];

  if (!version) {
    return <code>not found</code>;
  }

  return <code>{version}</code>;
}
