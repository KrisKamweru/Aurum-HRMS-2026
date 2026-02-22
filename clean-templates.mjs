import fs from 'fs';
import path from 'path';

const srcAppDir = path.resolve('src', 'app');
const legacyAppDir = path.resolve('legacy', 'app');

// 1. Copy src/app to legacy/app recursively
fs.cpSync(srcAppDir, legacyAppDir, { recursive: true });

// 2. Empty src/app
fs.rmSync(srcAppDir, { recursive: true, force: true });
fs.mkdirSync(srcAppDir, { recursive: true });

// 3. Function to recursively copy only .ts files, creating directories as needed
function processDirectory(sourceDir, targetDir) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    let isEmpty = true;

    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            const isDirEmpty = processDirectory(sourcePath, targetPath);
            if (!isDirEmpty) {
                isEmpty = false;
            }
        } else if (entry.isFile() && sourcePath.endsWith('.ts')) {
            let content = fs.readFileSync(sourcePath, 'utf8');

            // 4. Replace inline templates
            // Match template: `...` or template: '...' or template: "..."
            content = content.replace(/template\s*:\s*`[\s\S]*?`/g, "template: ''");
            content = content.replace(/template\s*:\s*'[^']*'/g, "template: ''");
            content = content.replace(/template\s*:\s*"[^"]*"/g, "template: ''");

            fs.writeFileSync(targetPath, content, 'utf8');
            isEmpty = false;
        }
    }

    // Remove empty directories created in src
    if (isEmpty && fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }

    return isEmpty;
}

processDirectory(legacyAppDir, srcAppDir);
console.log('Cleanup and replacement complete!');
