import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await dbConnect();
    
    // First try to get clubs from MongoDB current_club field
    const clubsFromDB = await Product.distinct('current_club');
    
    // Filter out any null/undefined and sort alphabetically
    let clubList = clubsFromDB
      .filter((club): club is string => Boolean(club))
      .sort((a, b) => a.localeCompare(b));
    
    console.log(`Found ${clubList.length} unique clubs from MongoDB`);
    
    // If no clubs found in MongoDB, fall back to extracting from folder names
    if (clubList.length === 0) {
      console.log('No clubs found in MongoDB, falling back to folder names');
      const yupooPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps');
      const directories = fs.readdirSync(yupooPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      const clubsSet = new Set<string>();
      
      directories.forEach(dirName => {
        const match = dirName.match(/futbol-retro-([^-]+(?:-[^-]+)*)-\d{4}/);
        if (match) {
          const clubName = match[1].replace(/_/g, ' ');
          clubsSet.add(clubName);
        }
      });
      
      clubList = Array.from(clubsSet).sort((a, b) => a.localeCompare(b));
      console.log(`Extracted ${clubList.length} unique clubs from folder names`);
    }
    
    res.status(200).json({ 
      success: true,
      count: clubList.length,
      clubs: clubList,
      _debug: {
        timestamp: new Date().toISOString(),
        source: 'mongodb',
        totalClubs: clubList.length
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in /api/jerseys/clubs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
