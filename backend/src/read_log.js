import fs from 'fs';

try {
    const data = fs.readFileSync('debug_log.txt', 'utf16le'); // Read as UTF-16LE
    const lines = data.split('\n');

    lines.forEach(line => {
        if (line.includes('Node 8') || line.includes('Node 9') || line.includes('Node 24') || line.includes('Node 25') || line.includes('Node 26') || line.includes('FOUND') || line.includes('Enqueued')) {
            console.log(line.trim());
        }
    });
} catch (err) {
    console.error(err);
}
