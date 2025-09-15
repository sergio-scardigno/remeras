import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const yupooPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps');
    
    // List all directories
    const directories = fs.readdirSync(yupooPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Test the exact directory we're looking for
    const testDir = 'futbol-retro-soviet-union-1987';
    const dirExists = directories.includes(testDir);
    const dirPath = path.join(yupooPath, testDir);
    
    let dirContents: string[] = [];
    if (dirExists) {
      dirContents = fs.readdirSync(dirPath);
    }

    // Test the regex pattern
    const pattern = /futbol-retro-([^-]+(?:-[^-]+)*)-(\d{4})/;
    const match = testDir.match(pattern);

    res.status(200).json({
      success: true,
      testDir,
      dirExists,
      dirPath,
      dirContents,
      regexMatch: match ? {
        fullMatch: match[0],
        club: match[1],
        year: match[2]
      } : 'No match',
      allDirectories: directories
    });

  } catch (error) {
    console.error('Error in test-dir API:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
