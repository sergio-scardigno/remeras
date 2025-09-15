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
    let validDirectories = directories.filter(dirName => /futbol-retro-([^-]+)-(\d{4})/.test(dirName));
    // Si no hay filtros, desordenar el array para que la carga inicial sea aleatoria
    if (!club && !year && !player) {
      // Shuffle usando Fisher-Yates
      for (let i = validDirectories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validDirectories[i], validDirectories[j]] = [validDirectories[j], validDirectories[i]];
      }
    }
    let paginatedDirs = [];
    let total = 0;
    const { skip = '0', limit = '50' } = req.query;
    const skipNum = parseInt(Array.isArray(skip) ? skip[0] : skip, 10) || 0;
    const limitNum = parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 50;

    // Si solo hay filtro de jugador, buscar en toda la colección Product
    if (player && !club && !year) {
      let playerStr = Array.isArray(player) ? player[0] : player;
      playerStr = playerStr.trim().replace(/\s+/g, ' ').toLowerCase();
      // Buscar todos los productos donde el jugador coincida
      const products = await Product.find({
        player_name: { $regex: playerStr, $options: 'i' }
      }).lean();
      // Mapear a {club, year} únicos
      const jerseyMap = new Map();
      for (const prod of products) {
        if (!prod.current_club || !prod.season_id) continue;
        // Buscar todos los directorios que contengan el año y el club (flexible)
        const yearDir = prod.season_id.toString();
        // Normalizar club para buscar coincidencias parciales
        const clubNorm = prod.current_club.replace(/ /g, '_').toLowerCase();
        const posiblesDirs = directories.filter(dir =>
          dir.toLowerCase().includes(yearDir) &&
          dir.toLowerCase().includes(clubNorm)
        );
        for (const dirName of posiblesDirs) {
          const key = `${dirName}`;
          if (!jerseyMap.has(key)) {
            jerseyMap.set(key, {
              dirName,
              club: prod.current_club,
              year: prod.season_id,
              players: [],
            });
          }
          // Para cada directorio, traer todos los jugadores de ese equipo y año
          if (!jerseyMap.get(key).players.length) {
            // Solo si aún no se cargaron los jugadores
            const allPlayers = await Product.find({
              current_club: prod.current_club,
              season_id: prod.season_id
            }).lean();
            jerseyMap.get(key).players = allPlayers;
          }
        }
      }
      const allDirs = Array.from(jerseyMap.values());
      total = allDirs.length;
      paginatedDirs = allDirs.slice(skipNum, skipNum + limitNum);
      // Para compatibilidad con el resto del código, paginatedDirs será un array de objetos con dirName, club, year, players
    } else {
      // Filtro original por club/año
      if (club) {
        const clubStr = Array.isArray(club) ? club[0] : club;
        validDirectories = validDirectories.filter(dirName => {
          const match = dirName.match(/futbol-retro-([^-]+)-(\d{4})/);
          if (!match) return false;
          const clubName = match[1].replace(/_/g, ' ');
          return clubName.toLowerCase() === clubStr.toLowerCase();
        });
      }
      if (year) {
        const yearStr = Array.isArray(year) ? year[0] : year;
        validDirectories = validDirectories.filter(dirName => {
          const match = dirName.match(/futbol-retro-([^-]+)-(\d{4})/);
          if (!match) return false;
          return match[2] === yearStr;
        });
      }
  const filteredJerseys = validDirectories;
  total = filteredJerseys.length;
  paginatedDirs = filteredJerseys.slice(skipNum, skipNum + limitNum);
    }


    const jerseysData = await Promise.all(
      paginatedDirs.map(async (item) => {
        // item puede ser string (dirName) o {dirName, club, year, players}
        let dirName, club, year, prePlayers;
        if (typeof item === 'string') {
          dirName = item;
          const match = dirName.match(/futbol-retro-([^-]+)-(\d{4})/);
          if (!match) return null;
          club = match[1].replace(/_/g, ' ');
          year = parseInt(match[2], 10);
        } else {
          dirName = item.dirName;
          club = item.club;
          year = item.year;
          prePlayers = item.players;
        }

        // Encontrar la primera imagen en el directorio
        let imageUrl = null;
        try {
          const files = fs.readdirSync(path.join(yupooPath, dirName));
          const imageFile = files.find(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
          if (imageFile) {
            imageUrl = `/yupoo_downloads_webps/${dirName}/${imageFile}`;
          }
        } catch {}

        // Buscar jugadores en la base de datos
        let playersRaw = prePlayers || await Product.find({ current_club: new RegExp(club, 'i'), season_id: year }).lean();
        // Si hay filtro de jugador y no es búsqueda global, filtrar los jugadores
        if (player && (club || year)) {
          let playerStr = Array.isArray(player) ? player[0] : player;
          playerStr = playerStr.trim().replace(/\s+/g, ' ').toLowerCase();
          playersRaw = playersRaw.filter((p: { player_name?: string }) => {
            if (!p.player_name) return false;
            return p.player_name.trim().replace(/\s+/g, ' ').toLowerCase().includes(playerStr);
          });
        }
        // Asegurar que todos los jugadores tengan player_name
  const uniquePlayers = Array.from(new Map((playersRaw || []).filter((p: { player_name?: string }) => p.player_name).map((player: { player_name: string }) => [player.player_name, player])).values());

        // Si hay filtro de jugador y no hay jugadores, no mostrar la camiseta
        if (player && uniquePlayers.length === 0) return null;

        return {
          club,
          year,
          imageUrl,
          players: uniquePlayers,
          folderName: dirName
        };
      })
    );

    res.status(200).json({ success: true, data: jerseysData.filter(item => item !== null), total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}
