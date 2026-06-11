import { MapPin, Minus, Plus } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { buildGoogleMapsSearchUrl } from '../../lib/googleMaps';

interface DraggableLocationMapProps {
  latitude: string;
  longitude: string;
  fallbackQuery?: string;
  onChange: (latitude: string, longitude: string) => void;
  onCommit?: (latitude: string, longitude: string) => void;
}

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_LATITUDE = -7.2575;
const DEFAULT_LONGITUDE = 112.7521;
const OVERSCAN = 2; // tiles beyond viewport for smooth scrolling

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
  fallbackQuery: _fallbackQuery,
  onChange,
  onCommit,
}: DraggableLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; centerLat: number; centerLon: number } | null>(null);
  const lastCoordinateRef = useRef<{ latitude: string; longitude: string } | null>(null);
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

  // The effective center accounts for drag offset
  const effectiveCenter = useMemo(() => {
    if (!dragging) return center;
    const centerTileX = lonToTileX(center.lon, zoom);
    const centerTileY = latToTileY(center.lat, zoom);
    const newTileX = centerTileX + dragOffset.x / TILE_SIZE;
    const newTileY = centerTileY + dragOffset.y / TILE_SIZE;
    return {
      lat: clamp(tileYToLat(newTileY, zoom), -85, 85),
      lon: clamp(tileXToLon(newTileX, zoom), -180, 180),
    };
  }, [center, dragOffset.x, dragOffset.y, zoom, dragging]);

  // Build tile list covering the container + overscan
  const tiles = useMemo(() => {
    const container = containerRef.current;
    const width = container?.clientWidth || 400;
    const height = container?.clientHeight || 288;
    const centerTileX = lonToTileX(effectiveCenter.lon, zoom);
    const centerTileY = latToTileY(effectiveCenter.lat, zoom);
    const halfTilesX = Math.ceil(width / (2 * TILE_SIZE)) + OVERSCAN;
    const halfTilesY = Math.ceil(height / (2 * TILE_SIZE)) + OVERSCAN;

    const tileList: Array<{ key: string; src: string; left: number; top: number }> = [];
    const maxTile = 2 ** zoom;

    for (let dy = -halfTilesY; dy <= halfTilesY; dy++) {
      for (let dx = -halfTilesX; dx <= halfTilesX; dx++) {
        const tileX = Math.floor(centerTileX) + dx;
        const tileY = Math.floor(centerTileY) + dy;
        if (tileY < 0 || tileY >= maxTile) continue;
        const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
        const pixelOffsetX = (centerTileX - Math.floor(centerTileX)) * TILE_SIZE;
        const pixelOffsetY = (centerTileY - Math.floor(centerTileY)) * TILE_SIZE;
        tileList.push({
          key: `${zoom}/${wrappedX}/${tileY}`,
          src: `https://a.tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
          left: dx * TILE_SIZE - pixelOffsetX + dragOffset.x,
          top: dy * TILE_SIZE - pixelOffsetY + dragOffset.y,
        });
      }
    }
    return tileList;
  }, [effectiveCenter.lat, effectiveCenter.lon, zoom, dragOffset.x, dragOffset.y]);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !dragStartRef.current) return;
    const deltaX = clientX - dragStartRef.current.pointerX;
    const deltaY = clientY - dragStartRef.current.pointerY;
    setDragOffset({ x: deltaX, y: deltaY });

    const centerTileX = lonToTileX(dragStartRef.current.centerLon, zoom);
    const centerTileY = latToTileY(dragStartRef.current.centerLat, zoom);
    const newTileX = centerTileX + deltaX / TILE_SIZE;
    const newTileY = centerTileY + deltaY / TILE_SIZE;
    const nextLat = tileYToLat(newTileY, zoom).toFixed(6);
    const nextLon = tileXToLon(newTileX, zoom).toFixed(6);
    lastCoordinateRef.current = { latitude: nextLat, longitude: nextLon };
    onChange(nextLat, nextLon);
  }, [zoom, onChange]);

  const changeZoom = (delta: number) => {
    setZoom((current) => clamp(current + delta, MIN_ZOOM, MAX_ZOOM));
    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
  };

  const commitDrag = useCallback(() => {
    if (lastCoordinateRef.current) {
      const { latitude: lat, longitude: lon } = lastCoordinateRef.current;
      onCommit?.(lat, lon);
    }
    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
    lastCoordinateRef.current = null;
  }, [onCommit]);

  const displayLat = dragging ? effectiveCenter.lat : center.lat;
  const displayLon = dragging ? effectiveCenter.lon : center.lon;
  const externalUrl = useMemo(() => buildGoogleMapsSearchUrl(`${displayLat},${displayLon}`), [displayLat, displayLon]);

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#101010] overflow-hidden">
      <div
        ref={containerRef}
        className="relative h-72 overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
        onWheel={(event) => {
          event.preventDefault();
          changeZoom(event.deltaY > 0 ? -1 : 1);
        }}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStartRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            centerLat: center.lat,
            centerLon: center.lon,
          };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          updateFromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (!dragging) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
          commitDrag();
        }}
        onPointerCancel={() => {
          setDragging(false);
          setDragOffset({ x: 0, y: 0 });
          dragStartRef.current = null;
          lastCoordinateRef.current = null;
        }}
      >
        {/* OSM tile layer — no default markers */}
        <div className="absolute inset-0">
          {tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="absolute pointer-events-none"
              style={{ left: tile.left, top: tile.top }}
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        {/* Single yellow marker — no duplicate */}
        <div
          className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
          style={{ transform: `translate(-50%, -100%)` }}
        >
          <MapPin className="w-10 h-10 text-[#F5C800] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" fill="#F5C800" strokeWidth={1} />
        </div>
        <div className="absolute left-3 top-3 rounded-lg bg-black/65 px-3 py-2 text-xs text-white pointer-events-none">
          Geser peta untuk mengatur titik lokasi
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
          Posisi: <span className="text-white">{displayLat.toFixed(6)}, {displayLon.toFixed(6)}</span>
          <span className="ml-3 text-[#666666]">Zoom {zoom}</span>
        </div>
        <a
          href={externalUrl}
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
