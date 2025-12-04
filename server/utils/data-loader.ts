import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load a JSON data file with robust path resolution for different environments
 * @param relativePath - Path relative to server/data/ directory (e.g., 'welcome_emails.json')
 * @returns Parsed JSON data or null if file not found
 */
export async function loadDataFile<T = any>(relativePath: string): Promise<T | null> {
  try {
    const fs = await import('fs');
    
    // Try multiple possible paths for the data file
    const possiblePaths = [
      path.join(__dirname, '../data', relativePath),              // From server/utils/
      path.join(__dirname, '../../data', relativePath),           // From dist/utils/
      path.join(process.cwd(), 'server/data', relativePath),      // From project root
      path.join(process.cwd(), 'data', relativePath),             // Alternative root
      path.join(__dirname, '../server/data', relativePath),       // From functions root
    ];
    
    for (const filePath of possiblePaths) {
      try {
        console.log(`[data-loader] Attempting to read file from: ${filePath}`);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          console.log(`[data-loader] Successfully loaded data from: ${filePath}`);
          return data as T;
        }
      } catch (err) {
        console.log(`[data-loader] Failed to read from: ${filePath}`, err);
      }
    }
    
    console.warn(`[data-loader] Could not find file '${relativePath}' in any of the expected locations`);
    return null;
  } catch (err) {
    console.error(`[data-loader] Error loading data file '${relativePath}':`, err);
    return null;
  }
}

/**
 * Save data to a JSON file with robust path resolution
 * @param relativePath - Path relative to server/data/ directory
 * @param data - Data to save
 * @returns true if successful, false otherwise
 */
export async function saveDataFile<T = any>(relativePath: string, data: T): Promise<boolean> {
  try {
    const fs = await import('fs');
    
    // Try to find an existing file first, or use the first writable path
    const possiblePaths = [
      path.join(__dirname, '../data', relativePath),              // From server/utils/
      path.join(process.cwd(), 'server/data', relativePath),      // From project root
    ];
    
    let targetPath: string | null = null;
    
    // First, try to find existing file
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        targetPath = filePath;
        break;
      }
    }
    
    // If no existing file, use first path and ensure directory exists
    if (!targetPath) {
      targetPath = possiblePaths[0];
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    const fileContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(targetPath, fileContent, 'utf-8');
    console.log(`[data-loader] Successfully saved data to: ${targetPath}`);
    return true;
  } catch (err) {
    console.error(`[data-loader] Error saving data file '${relativePath}':`, err);
    return false;
  }
}
