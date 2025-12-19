
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Mimic FinancialService location (src/services) vs Script location (src/scripts)
// FinancialService is in ../services relative to script? No.
// Script is in src/scripts.
// FinancialService is in src/services.
// Config is in src/config.

// In FinancialService (src/services): path was '../config/plan_config.json' -> src/config.
// In Script (src/scripts): path '../config/plan_config.json' -> src/config.
// So usage is identical.

console.log("__dirname:", __dirname);
const configPath = path.resolve(__dirname, '../config/plan_config.json');
console.log("Resolved Path:", configPath);

try {
    if (fs.existsSync(configPath)) {
        console.log("File Exists!");
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log("Config keys:", Object.keys(config));
        console.log("L2 Config:", config.waterfall_levels["2"] ? "FOUND" : "MISSING");
    } else {
        console.log("FILE NOT FOUND!");
        // List dir
        console.log("Dir contents:", fs.readdirSync(path.join(__dirname, '../')));
    }
} catch (e) {
    console.error("Load Error:", e);
}
