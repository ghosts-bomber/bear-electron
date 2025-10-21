import { getCacheSubDir,getAppCacheDir} from '../electron-main/cache-utils';
import path from 'path';
describe('getCacheSubDir function test', () => {
  it('should return the correct cache subdirectory path', async () => {
    const subDirName = 'test-subdir';
    const cacheDir = await getCacheSubDir(subDirName);
    console.log(`cacheDir: ${cacheDir}`);
    expect(cacheDir).toBe(path.join(await getAppCacheDir(), subDirName));
  });
});