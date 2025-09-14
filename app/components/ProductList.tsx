"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Modal from './Modal';

interface Player {
  _id: string;
  player_name: string;
  team_id: number;
  player_id: number;
}

interface Jersey {
  club: string;
  year: number;
  imageUrl: string | null;
  players: Player[];
  folderName: string;
}

const ProductList = () => {
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [playersModal, setPlayersModal] = useState<Jersey | null>(null);
  const [galleryModal, setGalleryModal] = useState<{jersey: Jersey, images: string[]} | null>(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchJerseys = async () => {
      try {
        const res = await fetch('/api/jerseys');
        if (!res.ok) throw new Error('Error al obtener la información de las camisetas');
        const data = await res.json();
        if (data.success) setJerseys(data.data);
        else throw new Error('La API no devolvió datos exitosos');
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJerseys();
  }, []);

  const handleImageClick = async (jersey: Jersey) => {
    setIsGalleryLoading(true);
    setGalleryModal({ jersey, images: [] });
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(jersey.folderName)}`);
      const data = await res.json();
      if (data.success) {
        setGalleryModal({ jersey, images: data.data });
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  if (loading) return <p className="text-center text-xl">Cargando catálogo...</p>;
  if (error) return <p className="text-center text-xl text-red-500">Error: {error}</p>;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Catálogo de Camisetas Retro</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {jerseys.map((jersey) => (
          <div key={jersey.folderName} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
            <div className="relative w-full h-64 cursor-pointer" onClick={() => handleImageClick(jersey)}>
              {jersey.imageUrl ? (
                <Image src={jersey.imageUrl} alt={`Camiseta de ${jersey.club} ${jersey.year}`} layout="fill" objectFit="cover" />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center"><p className="text-gray-500">Sin imagen</p></div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h2 className="text-2xl font-bold">{jersey.club}</h2>
              <p className="text-lg text-gray-600 mb-4">Temporada {jersey.year}</p>
              <div className="mt-auto">
                <button onClick={() => setPlayersModal(jersey)} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  Ver Jugadores ({jersey.players.length})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={playersModal !== null} onClose={() => setPlayersModal(null)} title={`Jugadores de ${playersModal?.club} ${playersModal?.year}`}>
        {playersModal && (
          <div className="space-y-2">
            {[...playersModal.players]
              .sort((a, b) => (a.player_id || 0) - (b.player_id || 0))
              .map(player => (
                <div key={player._id} className="flex items-center gap-2">
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm text-black">
                    {player.player_id || 'N/A'}
                  </span>
                  <span className="text-black">{player.player_name}</span>
                </div>
              ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={galleryModal !== null} onClose={() => setGalleryModal(null)} title={`Galería de ${galleryModal?.jersey.club} ${galleryModal?.jersey.year}`}>
        {isGalleryLoading ? <p>Cargando imágenes...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryModal?.images.map((imgSrc, index) => (
              <div key={index} className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                   onClick={() => setFullscreenImage(imgSrc)}>
                <Image 
                  src={imgSrc} 
                  alt={`Imagen ${index + 1}`} 
                  layout="fill" 
                  objectFit="cover" 
                  className="rounded-md"
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal de Imagen en Pantalla Completa */}
      <div className={`fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 ${fullscreenImage ? 'block' : 'hidden'}`}>
        <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
            <h2 className="text-xl font-bold text-white">{galleryModal?.jersey.club} - {galleryModal?.jersey.year}</h2>
            <button 
              onClick={() => setFullscreenImage(null)}
              className="text-white text-3xl font-bold hover:text-gray-300"
            >
              &times;
            </button>
          </div>
          <div className="relative flex-1">
            {fullscreenImage && (
              <Image
                src={fullscreenImage}
                alt="Imagen en pantalla completa"
                layout="fill"
                objectFit="contain"
                className="p-4"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
