const fs = require('fs');
const content = fs.readFileSync('backend/package.json', 'utf8');

const keys = new Set();
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^"([^"]+)":/);
    if (match) {
        const key = match[1];
        if (keys.has(key)) {
            console.log(`Duplicate key found: "${key}" on line ${i + 1}`);
        } else {
            keys.add(key);
        }
    }
}
console.log('Check complete.');
