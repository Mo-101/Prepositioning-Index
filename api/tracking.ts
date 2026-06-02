export interface TransitWaypoint {
    name: string;
    coordinates: [number, number];
    timestamp?: string;
    status: 'Passed' | 'Current' | 'Pending';
}

export interface TransitTelemetry {
    shipmentId: string;
    origin: string;
    destination: string;
    status: 'Staged' | 'Dispatched' | 'In-Transit' | 'Delivered' | 'Delayed';
    currentLocation: [number, number];
    routeGeometry: [number, number][];
    waypoints: TransitWaypoint[];
}

const routeGeometry: [number, number][] = [
    [39.6682, -4.0435],
    [38.4851, -3.3486],
    [36.8219, -1.2921],
    [35.2698, -0.5143],
    [34.768, -0.0917],
    [32.5825, 0.3476],
];

const buildTelemetry = (shipmentId: string): TransitTelemetry => ({
    shipmentId,
    origin: 'Regional Supply Hub (Mombasa)',
    destination: 'District Treatment Depot (Kampala)',
    status: 'In-Transit',
    currentLocation: [36.8219, -1.2921],
    routeGeometry,
    waypoints: [
        {
            name: 'Mombasa Port',
            coordinates: [39.6682, -4.0435],
            timestamp: '2026-06-01 08:00',
            status: 'Passed',
        },
        {
            name: 'Voi Checkpoint',
            coordinates: [38.4851, -3.3486],
            timestamp: '2026-06-01 14:30',
            status: 'Passed',
        },
        {
            name: 'Nairobi Central Interchange',
            coordinates: [36.8219, -1.2921],
            timestamp: '2026-06-02 09:15',
            status: 'Current',
        },
        { name: 'Nakuru Transit Point', coordinates: [35.2698, -0.5143], status: 'Pending' },
        { name: 'Kisumu Storage Yard', coordinates: [34.768, -0.0917], status: 'Pending' },
        { name: 'Kampala Logistics Base', coordinates: [32.5825, 0.3476], status: 'Pending' },
    ],
});

export default function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const rawShipmentId = Array.isArray(req.query?.shipmentId)
            ? req.query.shipmentId[0]
            : req.query?.shipmentId;
        const shipmentId = rawShipmentId || 'TRK-GENERIC-101';

        return res.status(200).json({ success: true, data: buildTelemetry(shipmentId) });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown tracking error';
        return res.status(500).json({ success: false, error: message });
    }
}
