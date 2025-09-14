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

    const jerseysData = await Promise.all(
      directories.map(async (dirName) => {
        // Extraer club y año del nombre del directorio
        const match = dirName.match(/futbol-retro-([^-]+)-(\d{4})/);
        if (!match) return null;

        const club = match[1].replace(/_/g, ' '); // Reemplazar guiones bajos si los hubiera
        const year = parseInt(match[2], 10);

        // Encontrar la primera imagen en el directorio
        let imageUrl = null;
        try {
          const files = fs.readdirSync(path.join(yupooPath, dirName));
          const imageFile = files.find(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
          if (imageFile) {
            imageUrl = `/yupoo_downloads_webps/${dirName}/${imageFile}`;
          }
        } catch {
          // El directorio podría estar vacío o inaccesible, continuamos
        }

        // Buscar jugadores en la base de datos
        const playersRaw = await Product.find({
          current_club: new RegExp(club, 'i'), // Búsqueda case-insensitive
          season_id: year
        }).lean(); // Usar .lean() para obtener objetos JS planos y mejorar el rendimiento

        // Eliminar jugadores duplicados por nombre
        const uniquePlayers = Array.from(new Map(playersRaw.map(player => [player.player_name, player])).values());

        return {
          club,
          year,
          imageUrl,
          players: uniquePlayers,
          folderName: dirName
        };
      })
    );

    // Filtrar resultados nulos (directorios que no coincidieron con el patrón)
    const filteredData = jerseysData.filter(item => item !== null);

    res.status(200).json({ success: true, data: filteredData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}
