import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { TransitTelemetry, TransitWaypoint } from '../types';

interface TrackingMapProps {
    shipmentId: string;
}

interface TrackingApiResponse {
    success: boolean;
    data?: TransitTelemetry;
    error?: string;
}

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const getStatusClassName = (waypoint: TransitWaypoint): string => {
    const base = 'w-4 h-4 rounded-full border-2 shadow-lg transition-all duration-300';
    if (waypoint.status === 'Current') {
        return `${base} bg-emerald-400 border-white scale-125 animate-pulse`;
    }
    if (waypoint.status === 'Passed') {
        return `${base} bg-emerald-600 border-emerald-900`;
    }
    return `${base} bg-gray-800 border-gray-600`;
};

const buildWaypointPopup = (waypoint: TransitWaypoint): string => `
  <div class="p-2 bg-gray-900 text-gray-100 rounded text-xs border border-gray-800 font-sans">
    <p class="font-bold text-gray-200">${escapeHtml(waypoint.name)}</p>
    <p class="text-[10px] text-gray-400">Status: ${waypoint.status}</p>
    ${
        waypoint.timestamp
            ? `<p class="text-[10px] text-emerald-400">${escapeHtml(waypoint.timestamp)}</p>`
            : ''
    }
  </div>
`;

const StaticTelemetryFallback: React.FC<{ telemetry: TransitTelemetry | null; error: string }> = ({
    telemetry,
    error,
}) => (
    <div className="w-full min-h-[500px] bg-gray-950 border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
        <div>
            <h4 className="font-bold text-gray-200 mb-2">Transit Telemetry Active</h4>
            <p className="text-xs text-amber-300 mb-4">
                {error || 'Mapbox token unavailable. Showing structured route telemetry instead.'}
            </p>
            {telemetry && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-gray-300">
                    <div className="bg-gray-900/80 border border-gray-800 rounded p-3">
                        <span className="text-gray-500">ID:</span> {telemetry.shipmentId}
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded p-3">
                        <span className="text-gray-500">Status:</span>{' '}
                        <span className="text-emerald-400 font-bold">{telemetry.status}</span>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded p-3">
                        <span className="text-gray-500">From:</span> {telemetry.origin}
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded p-3">
                        <span className="text-gray-500">To:</span> {telemetry.destination}
                    </div>
                </div>
            )}
        </div>
        {telemetry && (
            <ol className="mt-6 space-y-2 text-xs text-gray-300">
                {telemetry.waypoints.map((waypoint) => (
                    <li
                        key={`${waypoint.name}-${waypoint.status}`}
                        className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded px-3 py-2"
                    >
                        <span>{waypoint.name}</span>
                        <span
                            className={
                                waypoint.status === 'Current'
                                    ? 'text-emerald-300 font-bold'
                                    : 'text-gray-500'
                            }
                        >
                            {waypoint.status}
                        </span>
                    </li>
                ))}
            </ol>
        )}
    </div>
);

const TrackingMap: React.FC<TrackingMapProps> = ({ shipmentId }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [telemetry, setTelemetry] = useState<TransitTelemetry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const fetchTrackingData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(
                    `/api/tracking?shipmentId=${encodeURIComponent(shipmentId)}`,
                    { signal: controller.signal }
                );
                const result = (await response.json()) as TrackingApiResponse;
                if (!response.ok || !result.success || !result.data) {
                    throw new Error(result.error || `Tracking API returned ${response.status}`);
                }
                setTelemetry(result.data);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : 'Failed to load telemetry.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchTrackingData();
        return () => controller.abort();
    }, [shipmentId]);

    useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!mapContainerRef.current || !telemetry || !token) return;

        mapboxgl.accessToken = token;
        mapRef.current?.remove();
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: telemetry.currentLocation,
            zoom: 5.5,
            pitch: 30,
        });

        const map = mapRef.current;
        map.on('load', () => {
            map.addSource('route-path', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: telemetry.routeGeometry,
                    },
                },
            });

            map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route-path',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#10b981',
                    'line-width': 3,
                    'line-opacity': 0.68,
                },
            });

            telemetry.waypoints.forEach((waypoint) => {
                const markerElement = document.createElement('div');
                markerElement.className = getStatusClassName(waypoint);

                const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
                    buildWaypointPopup(waypoint)
                );

                new mapboxgl.Marker(markerElement)
                    .setLngLat(waypoint.coordinates)
                    .setPopup(popup)
                    .addTo(map);
            });
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [telemetry]);

    if (loading) {
        return (
            <div className="w-full h-96 bg-gray-950 flex items-center justify-center border border-gray-900 rounded-lg">
                <span className="text-sm font-mono text-gray-400">
                    Loading Geospatial Overlays...
                </span>
            </div>
        );
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || error) {
        return <StaticTelemetryFallback telemetry={telemetry} error={error} />;
    }

    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-gray-950">
            <div className="absolute top-4 left-4 z-10 p-4 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded shadow-md max-w-xs text-xs font-mono">
                <h4 className="font-bold text-gray-200 mb-1">Transit Telemetry Active</h4>
                <div className="text-gray-400 space-y-1">
                    <p>
                        <span className="text-gray-500">ID:</span> {telemetry?.shipmentId}
                    </p>
                    <p>
                        <span className="text-gray-500">Status:</span>{' '}
                        <span className="text-emerald-400 font-bold">{telemetry?.status}</span>
                    </p>
                    <p className="truncate">
                        <span className="text-gray-500">From:</span> {telemetry?.origin}
                    </p>
                    <p className="truncate">
                        <span className="text-gray-500">To:</span> {telemetry?.destination}
                    </p>
                </div>
            </div>
            <div ref={mapContainerRef} className="w-full h-[500px]" />
        </div>
    );
};

export default TrackingMap;
