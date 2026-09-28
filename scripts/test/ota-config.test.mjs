import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('apps/mobile/app.json','utf8')).expo;
const manifest=fs.readFileSync('apps/mobile/android/app/src/main/AndroidManifest.xml','utf8');
const strings=fs.readFileSync('apps/mobile/android/app/src/main/res/values/strings.xml','utf8');
test('signed Android and Expo config target the same isolated OTA runtime and channel',()=>{
 assert.equal(config.updates.enabled,true);
 assert.equal(config.updates.url,`https://u.expo.dev/${config.extra.eas.projectId}`);
 assert.equal(config.updates.requestHeaders['expo-channel-name'],'staging');
 assert.ok(manifest.includes('android:name="expo.modules.updates.ENABLED" android:value="true"'));
 assert.ok(manifest.includes(`android:value="${config.updates.url}"`));
 assert.ok(manifest.includes('&quot;expo-channel-name&quot;:&quot;staging&quot;'));
 assert.ok(strings.includes(`>${config.runtimeVersion}</string>`));
 assert.ok(manifest.includes('android:value="@string/expo_runtime_version"'));
 assert.ok(JSON.parse(fs.readFileSync('apps/mobile/package.json','utf8')).dependencies['expo-updates']);
});
