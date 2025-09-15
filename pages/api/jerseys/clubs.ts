import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const yupooPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps');
    const directories = fs.readdirSync(yupooPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Extraer todos los clubes únicos de todos los directorios válidos
    const validDirectories = directories.filter(dirName => /futbol-retro-([^-]+)-\d{4}/.test(dirName));
    const clubsSet = new Set<string>();
    validDirectories.forEach(dirName => {
      const match = dirName.match(/futbol-retro-([^-]+)-\d{4}/);
      if (match) {
        const club = match[1].replace(/_/g, ' ');
        clubsSet.add(club);
      }
    });
    const clubs = Array.from(clubsSet).sort();
    res.status(200).json({ success: true, clubs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}
