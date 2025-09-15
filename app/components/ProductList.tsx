"use client";

import { useEffect, useState, useRef } from 'react';
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
  year: string; // Changed from number to string to match the actual usage
  imageUrl: string | null;
  players: Player[];
  folderName: string;
}



const INITIAL_LOAD = 50;
const LOAD_MORE = 30;

const ProductList = () => {
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [playersModal, setPlayersModal] = useState<Jersey | null>(null);
  const [galleryModal, setGalleryModal] = useState<{jersey: Jersey, images: string[]} | null>(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Estados para filtros
  const [searchClub, setSearchClub] = useState('');
  const [searchYear, setSearchYear] = useState<string>('');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [debouncedPlayer, setDebouncedPlayer] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);


  // Clubs para el select (de la API)
  const [clubs, setClubs] = useState<string[]>([]);
  const years = Array.from(new Set(jerseys.map(j => j.year.toString()))).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  // El listado de jugadores solo se arma con los jerseys cargados actualmente
  // (eliminado: players no se usa)

  // Traer todos los clubes únicos al montar
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await fetch('/api/jerseys/clubs');
        const data = await res.json();
        if (data.success) setClubs(data.clubs);
      } catch {
        // Si falla, fallback a los clubes cargados
        setClubs(Array.from(new Set(jerseys.map(j => j.club))).sort());
      }
    };
    fetchClubs();
    // eslint-disable-next-line
  }, []);

  // Debounce para el input de jugador
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedPlayer(searchPlayer);
    }, 400);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchPlayer]);

  // Fetch jerseys con filtros (usar debouncedPlayer)
  useEffect(() => {
    const fetchJerseys = async () => {
      try {
        setLoading(true);
        // Construir query string con filtros
        const params = new URLSearchParams();
        params.append('skip', '0');
        params.append('limit', INITIAL_LOAD.toString());
        if (searchClub) params.append('club', searchClub);
        if (searchYear) params.append('year', searchYear);
        if (debouncedPlayer) params.append('player', debouncedPlayer);
        const res = await fetch(`/api/jerseys?${params.toString()}`);
        if (!res.ok) throw new Error('Error al obtener la información de las camisetas');
        const data = await res.json();
        
        // Transform the API response to match the expected format
        const formattedJerseys = data.results.map((item: any) => ({
          folderName: item.folderName,
          imageUrl: item.imageUrl,
          club: item.folderName.split('-').slice(2, -1).join(' '), // Extract club name from folder
          year: item.folderName.split('-').pop() || '0', // Keep year as string for display
          players: [] // Initialize empty players array
        }));
        
        setJerseys(formattedJerseys);
        setTotal(data.total);
        setHasMore((data.page || 1) < (data.totalPages || 1));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchJerseys();
    // eslint-disable-next-line
  }, [searchClub, searchYear, debouncedPlayer]);

  // Cargar más jerseys al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        hasMore && !isFetchingMore && !loading
      ) {
        fetchMoreJerseys();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line
  }, [hasMore, isFetchingMore, loading, jerseys.length]);

  const fetchMoreJerseys = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const params = new URLSearchParams();
      params.append('skip', jerseys.length.toString());
      params.append('limit', LOAD_MORE.toString());
      if (searchClub) params.append('club', searchClub);
      if (searchYear) params.append('year', searchYear);
      if (debouncedPlayer) params.append('player', debouncedPlayer);
      
      const res = await fetch(`/api/jerseys?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar más camisetas');
      const data = await res.json();
      
      // Transform the API response to match the expected format
      const newJerseys = data.results.map((item: any) => ({
        folderName: item.folderName,
        imageUrl: item.imageUrl,
        club: item.folderName.split('-').slice(2, -1).join(' '),
        year: item.folderName.split('-').pop() || '0', // Keep year as string
        players: []
      }));
      
      setJerseys(prev => [...prev, ...newJerseys]);
      setHasMore((data.page || 1) < (data.totalPages || 1));
    } catch {
      // Puedes mostrar un error si quieres
    } finally {
      setIsFetchingMore(false);
    }
  };

  // (Eliminado: ya no se usa visibleCount ni setVisibleCount)

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


  // Ya no se filtra en frontend, jerseys ya viene filtrado
  const filteredJerseys = jerseys;

  // Si hay filtro de jugador, mostrar solo camisetas donde ese jugador jugó (ya lo hace el backend)
  // Pero para UX, si el usuario escribe un nombre, mostrar sugerencias de jugadores

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Catálogo de Camisetas Retro el Fran</h1>

      {/* Formulario de búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
        <div>
          <label className="block text-sm font-medium mb-1">Equipo</label>
          <select
            className="border rounded px-2 py-1 w-full text-black bg-white"
            value={searchClub}
            onChange={e => setSearchClub(e.target.value)}
          >
            <option value="">Todos</option>
            {clubs.map(club => (
              <option key={club} value={club}>{club}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Año</label>
          <select
            className="border rounded px-2 py-1 w-full text-black bg-white"
            value={searchYear}
            onChange={e => setSearchYear(e.target.value)}
          >
            <option value="">Todos</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jugador</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full text-black bg-white"
            placeholder="Buscar jugador"
            value={searchPlayer}
            onChange={e => setSearchPlayer(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredJerseys.map((jersey, idx) => (
          <div key={`${jersey.folderName}-${idx}`} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
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
      {isFetchingMore && (
        <div className="flex justify-center mt-8">
          <span className="text-gray-500">Cargando más camisetas...</span>
        </div>
      )}
      {!hasMore && jerseys.length > 0 && (
        <div className="flex justify-center mt-8">
          <span className="text-gray-400">No hay más camisetas para mostrar.</span>
        </div>
      )}

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
