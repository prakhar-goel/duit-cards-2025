const repository = 'prakhar-goel/duit-cards-2025';
const releaseRoot = `https://github.com/${repository}/releases/download/`;

// Read the same release channel as the download. Reuse results briefly to stay
// within GitHub's anonymous API allowance, including simultaneous page loads.
export function createApkReleaseReader({ fetchJson = async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Release metadata is unavailable');
  return response.json();
}, now = Date.now } = {}) {
  let cached;
  return async function readRelease(apkUrl) {
    const target = new URL(apkUrl);
    if (!target.href.startsWith(releaseRoot) || target.search || target.hash || !/^([^/]+)\/DUIT-2026-Pilot\.apk$/.test(target.href.slice(releaseRoot.length))) {
      throw new Error('Invalid APK release URL');
    }
    if (cached?.url === apkUrl && cached.expires > now()) return cached.result;
    const entry = { url: apkUrl, expires: now() + 5 * 60_000 };
    entry.result = (async () => {
      const manifest = await fetchJson(new URL('android-build.json', target).href);
      if (!/^\d+\.\d+\.\d+$/.test(manifest.version || '') || !/^[a-f0-9]{64}$/.test(manifest.sha256 || '')) {
        throw new Error('Invalid APK build metadata');
      }
      const tag = `v${manifest.version}-staging`;
      if (manifest.url !== `${releaseRoot}${tag}/DUIT-2026-Pilot.apk`) throw new Error('APK release does not match its version');
      const release = await fetchJson(`https://api.github.com/repos/${repository}/releases/tags/${tag}`);
      const asset = release.assets?.find(item => item.name === 'DUIT-2026-Pilot.apk');
      if (release.draft || release.tag_name !== tag || asset?.digest !== `sha256:${manifest.sha256}` || !release.published_at || !Number.isFinite(Date.parse(release.published_at))) {
        throw new Error('Published APK could not be verified');
      }
      return { version: manifest.version, releasedAt: new Date(release.published_at).toISOString() };
    })().catch(error => {
      // A short failure cache prevents repeated page loads hammering GitHub.
      entry.expires = now() + 30_000;
      throw error;
    });
    cached = entry;
    return entry.result;
  };
}
