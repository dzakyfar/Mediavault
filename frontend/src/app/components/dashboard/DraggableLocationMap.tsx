import { MapPin, Minus, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface DraggableLocationMapProps {
  latitude: string;
  longitude: string;
  fallbackQuery?: string;
  onChange: (latitude: string, longitude: string) => void;
}

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 5;
const MAX_ZOOM = 19;
const DEFAULT_LATITUDE = -7.2575;
const DEFAULT_LONGITUDE = 112.7521;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const lonToTileX = (lon: number, zoom: number) => ((lon + 180) / 360) * (2 ** zoom);

const latToTileY = (lat: number, zoom: number) => {
  const rad = lat * Math.PI / 180;
  return ((1 - Math.log(Math.tan(rad) + (1 / Math.cos(rad))) / Math.PI) / 2) * (2 ** zoom);
};

const tileXToLon = (x: number, zoom: number) => (x / (2 ** zoom)) * 360 - 180;

const tileYToLat = (y: number, zoom: number) => {
  const n = Math.PI - (2 * Math.PI * y) / (2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

export default function DraggableLocationMap({
  latitude,
  longitude,
  fallbackQuery,
  onChange,
}: DraggableLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartTileRef = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const center = useMemo(() => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    return {
      lat: Number.isFinite(lat) ? clamp(lat, -85, 85) : DEFAULT_LATITUDE,
      lon: Number.isFinite(lon) ? clamp(lon, -180, 180) : DEFAULT_LONGITUDE,
    };
  }, [latitude, longitude]);

  const centerTile = useMemo(() => ({
    x: lonToTileX(center.lon, zoom),
    y: latToTileY(center.lat, zoom),
  }), [center.lat, center.lon, zoom]);

  const dragPosition = useMemo(() => {
    const nextTileX = centerTile.x + dragOffset.x / TILE_SIZE;
    const nextTileY = centerTile.y + dragOffset.y / TILE_SIZE;
    return {
      lat: tileYToLat(nextTileY, zoom),
      lon: tileXToLon(nextTileX, zoom),
    };
  }, [centerTile.x, centerTile.y, dragOffset.x, dragOffset.y, zoom]);

  const tiles = useMemo(() => {
    const baseX = Math.floor(centerTile.x);
    const baseY = Math.floor(centerTile.y);
    const offsetX = (centerTile.x - baseX) * TILE_SIZE;
    const offsetY = (centerTile.y - baseY) * TILE_SIZE;
    const maxTile = (2 ** zoom) - 1;

    return Array.from({ length: 25 }, (_, index) => {
      const dx = (index % 5) - 2;
      const dy = Math.floor(index / 5) - 2;
      const x = clamp(baseX + dx, 0, maxTile);
      const y = clamp(baseY + dy, 0, maxTile);
      return {
        key: `${x}-${y}`,
        url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
        left: `calc(50% + ${(dx * TILE_SIZE) - offsetX}px)`,
        top: `calc(50% + ${(dy * TILE_SIZE) - offsetY}px)`,
      };
    });
  }, [centerTile.x, centerTile.y, zoom]);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    const originTile = dragStartTileRef.current || centerTile;
    setDragOffset({ x, y });
    const nextTileX = originTile.x + x / TILE_SIZE;
    const nextTileY = originTile.y + y / TILE_SIZE;
    onChange(tileYToLat(nextTileY, zoom).toFixed(6), tileXToLon(nextTileX, zoom).toFixed(6));
  };

  const changeZoom = (delta: number) => {
    setZoom((current) => clamp(current + delta, MIN_ZOOM, MAX_ZOOM));
    setDragOffset({ x: 0, y: 0 });
    dragStartTileRef.current = null;
  };

  const mapsQuery = latitude && longitude ? `${latitude},${longitude}` : fallbackQuery || `${center.lat},${center.lon}`;

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#101010] overflow-hidden">
      <div
        ref={containerRef}
        className="relative h-72 overflow-hidden touch-none select-none"
        onWheel={(event) => {
          event.preventDefault();
          changeZoom(event.deltaY > 0 ? -1 : 1);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (!dragging) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
          dragStartTileRef.current = null;
          setDragOffset({ x: 0, y: 0 });
        }}
        onPointerCancel={() => {
          setDragging(false);
          dragStartTileRef.current = null;
          setDragOffset({ x: 0, y: 0 });
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            className="absolute w-64 h-64 max-w-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        <div className="absolute inset-0 bg-black/5" />
        <button
          type="button"
          onPointerDown={(event) => {
            event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
            dragStartTileRef.current = centerTile;
            setDragging(true);
            updateFromPointer(event.clientX, event.clientY);
          }}
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing text-[#F5C800] drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]"
          style={{ transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-100% + ${dragOffset.y}px))` }}
          aria-label="Geser titik lokasi"
        >
          <MapPin className="w-10 h-10 fill-[#F5C800] text-black" />
        </button>
        <div className="absolute left-3 top-3 rounded-lg bg-black/65 px-3 py-2 text-xs text-white">
          Geser marker untuk mengatur titik lokasi
        </div>
        <div className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-lg border border-[#2A2A2A] bg-black/70">
          <button
            type="button"
            onClick={() => changeZoom(1)}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 text-white hover:bg-[#F5C800] hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
            aria-label="Zoom in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="h-px bg-[#2A2A2A]" />
          <button
            type="button"
            onClick={() => changeZoom(-1)}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 text-white hover:bg-[#F5C800] hover:text-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
            aria-label="Zoom out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-[#2A2A2A] px-4 py-3 text-sm">
        <div className="text-[#888888]">
          Posisi: <span className="text-white">{dragPosition.lat.toFixed(6)}, {dragPosition.lon.toFixed(6)}</span>
          <span className="ml-3 text-[#666666]">Zoom {zoom}</span>
        </div>
        <a
          href={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="text-[#F5C800] hover:underline"
        >
          Buka di Google Maps
        </a>
      </div>
    </div>
  );
}
