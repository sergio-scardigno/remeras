import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

interface ApiResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { folderName } = req.query; // Esto será un array de strings

  if (!Array.isArray(folderName) || folderName.length === 0) {
    return res.status(400).json({ success: false, error: 'Nombre de carpeta inválido.' });
  }

  // Reconstruir el nombre de la carpeta a partir de los segmentos de la ruta
  const completeFolderName = folderName.join('/');

  try {
    const directoryPath = path.join(process.cwd(), 'public', 'yupoo_downloads', completeFolderName);
    const files = fs.readdirSync(directoryPath);

    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `/yupoo_downloads/${encodeURIComponent(completeFolderName)}/${encodeURIComponent(file)}`);

    res.status(200).json({ success: true, data: imageUrls });
  } catch (error) {
    console.error(`Error al leer el directorio ${completeFolderName}:`, error);
    res.status(404).json({ success: false, error: 'Carpeta no encontrada o error al leerla.' });
  }
}
