import React from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';

export default function MochaFloatsVersion() {
  const data = usePluginData('mochafloats-version-plugin') as {release: string | null} | undefined;

  if (!data?.release) {
    return <code>not found</code>;
  }

  return <code>{data.release}</code>;
}
