import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const yupooPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps');
    
    // 1. List all directories
    const directories = fs.readdirSync(yupooPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('Total directories:', directories.length);

    // 2. Find Soviet Union related directories
    const sovietDirs = directories.filter(dir => dir.toLowerCase().includes('soviet'));
    console.log('Soviet directories:', sovietDirs);

    // 3. Check if they match the expected pattern
    const pattern = /futbol-retro-(.+)-(\d{4})/;
    const matchedDirs = sovietDirs.map(dir => {
      const match = dir.match(pattern);
      return {
        dir,
        match: match ? {
          fullMatch: match[0],
          club: match[1],
          year: match[2]
        } : 'No match'
      };
    });

    // 4. Check if directories have images
    const dirsWithImages = matchedDirs.map(({ dir, match }) => {
      const dirPath = path.join(yupooPath, dir);
      const files = fs.readdirSync(dirPath);
      const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      
      return {
        dir,
        match,
        hasImages: images.length > 0,
        imageCount: images.length
      };
    });

    res.status(200).json({
      success: true,
      totalDirectories: directories.length,
      sovietDirectories: dirsWithImages
    });

  } catch (error) {
    console.error('Error in test-soviet API:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
