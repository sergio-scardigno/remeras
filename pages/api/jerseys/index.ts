import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  try {
    const yupooPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps');
    const directories = fs.readdirSync(yupooPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Filtros desde query
    const { club, year, player } = req.query;
    console.log('API Request - Club:', club, 'Year:', year, 'Player:', player);
    let validDirectories = directories.filter(dirName => {
      const isMatch = /futbol-retro-([^-]+(?:-[^-]+)*)-(\d{4})/.test(dirName);
      if (!isMatch) {
        console.log(`Directory does not match pattern: ${dirName}`);
      }
      return isMatch;
    });

    console.log(`Found ${validDirectories.length} valid directories matching pattern`);

    const clubStr = (club as string) || '';
    const yearStr = (year as string) || '';
    const playerStr = (player as string) || '';

    console.log('API Request - Query Params:', { club: clubStr, year: yearStr, player: playerStr });

    // Filter by club if specified
    if (clubStr) {
      console.log(`Filtering by club: '${clubStr}'`);
      
      validDirectories = validDirectories.filter(dirName => {
        const match = dirName.match(/futbol-retro-([^-]+(?:-[^-]+)*)-(\d{4})/);
        if (!match) return false;
        
        const clubFromFolder = match[1].replace(/_/g, ' ');
        
        // Normalize both the directory name and search query for comparison
        const normalizeString = (str: string) => 
          str.toLowerCase()
             .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
             .replace(/\s+/g, '-')          // Replace spaces with hyphens
             .replace(/-+/g, '-')           // Replace multiple hyphens with single
             .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
        
        const normalizedFolderClub = normalizeString(clubFromFolder);
        const normalizedSearchClub = normalizeString(clubStr);
        
        // Check for partial match to be more forgiving
        const isMatch = normalizedFolderClub.includes(normalizedSearchClub) || 
                       normalizedSearchClub.includes(normalizedFolderClub);
        
        // Log detailed matching information
        console.log(`Matching: '${dirName}'`);
        console.log(`- Extracted Club: '${clubFromFolder}'`);
        console.log(`- Normalized: '${normalizedFolderClub}'`);
        console.log(`- Search Term: '${normalizedSearchClub}'`);
        console.log(`- Match: ${isMatch ? '✅' : '❌'}`);
        
        return isMatch;
      });
      
      console.log(`After club filter, found ${validDirectories.length} matching directories`);
      if (validDirectories.length === 0) {
        console.log('No matching directories found. Available directories:');
        directories.slice(0, 20).forEach((dir, idx) => console.log(`[${idx + 1}] ${dir}`));
        if (directories.length > 20) console.log(`...and ${directories.length - 20} more`);
      }
    }

    // Filter by season_id if specified
    if (yearStr) {
      // First get all products that match the season_id
      const seasonId = parseInt(yearStr);
      const products = await Product.find({ season_id: seasonId }, 'folder_name');
      const validFolders = new Set(products.map(p => p.folder_name));
      
      // Filter directories to only include those with matching folder names
      validDirectories = validDirectories.filter(dirName => {
        const folderMatch = validFolders.has(dirName);
        if (!folderMatch) {
          console.log(`Season filter excluded: ${dirName} (no matching season_id: ${yearStr})`);
        }
        return folderMatch;
      });
      console.log(`After season filter, found ${validDirectories.length} matching directories`);
    }

    // Filter by player if specified
    if (playerStr) {
      validDirectories = validDirectories.filter(dirName => {
        const includesPlayer = dirName.toLowerCase().includes(playerStr.toLowerCase());
        if (!includesPlayer) {
          console.log(`Player filter excluded: ${dirName} (player not found: ${playerStr})`);
        }
        return includesPlayer;
      });
      console.log(`After player filter, found ${validDirectories.length} matching directories`);
    }

    // Log final filtered directories before pagination
    console.log(`Final filtered directories (${validDirectories.length} total):`);
    validDirectories.forEach((dir, idx) => {
      console.log(`[${idx + 1}] ${dir}`);
    });

    // Get paginated results
    const { skip = '0', limit = '50' } = req.query;
    const skipNum = parseInt(Array.isArray(skip) ? skip[0] : skip, 10) || 0;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 50;
    const startIndex = skipNum;
    const paginatedDirectories = validDirectories.slice(startIndex, startIndex + limitNum);

    console.log(`Pagination: Showing ${paginatedDirectories.length} items (skip ${skipNum}, limit ${limitNum})`);

    // Create response objects with folder name and image URL
    const results = await Promise.all(paginatedDirectories.map(async (dirName) => {
      // Get the first image from the directory as a thumbnail
      const images = fs.readdirSync(path.join(yupooPath, dirName)).filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      const imageUrl = images.length > 0 ? `/yupoo_downloads_webps/${dirName}/${images[0]}` : '';

      if (!imageUrl) {
        console.warn(`No images found in directory: ${dirName}`);
      } else {
        console.log(`Generated image URL for ${dirName}: ${imageUrl}`);
      }

      return {
        folderName: dirName,
        imageUrl: imageUrl,
        imageCount: images.length
      };
    }));

    const response = {
      results,
      total: validDirectories.length,
      page: Math.floor(skipNum / limitNum) + 1,
      totalPages: Math.ceil(validDirectories.length / limitNum),
      query: { club: clubStr, year: yearStr, player: playerStr },
      debug: {
        directoriesFound: validDirectories.length > 0,
        directories: validDirectories,
        timestamp: new Date().toISOString()
      }
    };

    console.log('API Response:', JSON.stringify({
      ...response,
      results: response.results.map(r => ({ 
        ...r, 
        // Truncate long strings for logging
        imageUrl: r.imageUrl ? `${r.imageUrl.substring(0, 60)}...` : '' 
      }))
    }, null, 2));

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}
