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
  console.log('Requested folder:', completeFolderName);

  try {
    const directoryPath = path.join(process.cwd(), 'public', 'yupoo_downloads_webps', completeFolderName);
    console.log('Looking for images in directory:', directoryPath);
    
    // Check if directory exists
    if (!fs.existsSync(directoryPath)) {
      console.error('Directory does not exist:', directoryPath);
      return res.status(404).json({ success: false, error: 'Carpeta no encontrada.' });
    }
    
    const files = fs.readdirSync(directoryPath);
    console.log('Found files:', files);

    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .sort((a, b) => {
        // Sort image named '1' first, then sort the rest alphabetically
        if (a.startsWith('1.')) return -1;
        if (b.startsWith('1.')) return 1;
        return a.localeCompare(b);
      })
      .map(file => {
        const url = `/yupoo_downloads_webps/${completeFolderName.split('/').map(encodeURIComponent).join('/')}/${encodeURIComponent(file)}`;
        console.log('Generated URL:', url);
        return url;
      });

    console.log('Sending image URLs:', imageUrls);
    res.status(200).json({ success: true, data: imageUrls });
  } catch (error) {
    console.error(`Error al leer el directorio ${completeFolderName}:`, error);
    res.status(500).json({ success: false, error: 'Error al leer la carpeta.' });
  }
}
