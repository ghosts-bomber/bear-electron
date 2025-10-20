import { extractFile,downloadFile } from '../electron-main/ipc-handlers';
import fs from 'fs';
import path from 'path';
import { create as tarCreate } from 'tar';
import zlib from 'zlib';

describe('extractFile function test', () => {
  const testDir = 'test-temp';
  const filePath = path.join(testDir, 'test.tar.gz');
  const testFileName = 'test.txt';
  const testContent = '123456';
  const extractDir = path.join(testDir, 'extract');

  beforeAll(async () => {
    // 1. 初始化目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true }); // 先清空旧目录
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(extractDir, { recursive: true });

    // 2. 创建测试文件
    const testFilePath = path.join(testDir, testFileName);
    fs.writeFileSync(testFilePath, testContent);

    // 3. 压缩文件（关键修复：用Promise等待流完成）
    await new Promise<void>((resolve, reject) => {
      const gzip = zlib.createGzip();
      const output = fs.createWriteStream(filePath);

       // 错误处理
        output.on('error', (err) => reject(err));
        gzip.on('error', (err) => reject(err));

        // 修复：显式声明无参数回调
        output.on('finish', () => resolve());
      // 执行压缩
      tarCreate(
        { cwd: testDir }, // 基于testDir，压缩testFileName
        [testFileName]
      )
        .pipe(gzip)
        .pipe(output);
    });

    // 4. 删除源文件（保留压缩包）
    fs.unlinkSync(testFilePath);
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('extractFile extracts a tar.gz file', async () => {
    // 先检查压缩包是否存在且非空
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0); // 确保压缩包有内容

    // 执行解压
    const extractedFiles = await extractFile(filePath, extractDir);

    // 检查解压结果
    expect(extractedFiles.length).toBe(1);
    expect(extractedFiles.includes(testFileName)).toBe(true);
    const extractedFilePath = path.join(extractDir, extractedFiles[0]);
    expect(fs.readFileSync(extractedFilePath, 'utf8')).toBe(testContent);
  });
});

describe('downloadFile function test', () => {
  const testDir = 'test-temp';
  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true }); // 先清空旧目录
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  test('downloadFile downloads a file', async () => {
    const testUrl = '';
    const testFilePath = path.join(testDir, 'test.txt');

    await downloadFile(testUrl, testFilePath);

    expect(fs.existsSync(testFilePath)).toBe(true);
    const stats = fs.statSync(testFilePath);
    expect(stats.size).toBeGreaterThan(0); // 确保文件有内容
  });
})