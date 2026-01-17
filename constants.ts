import { ShipmentData, ForwarderInputDef } from './types';

export const INDEX_WEIGHTS = {
    risk: 0.30,
    preparedness: 0.25,
    vulnerability: 0.25,
    outbreak: 0.20
};

export const HISTORICAL_DATA: ShipmentData[] = [
    {
        request_reference: "SR_24-001_NBO hub_Zimbabwe",
        origin: "Nairobi, Kenya",
        origin_longitude: 36.990054,
        origin_latitude: -1.2404475,
        destination: "Harare, Zimbabwe",
        destination_longitude: 31.08848075,
        destination_latitude: -17.80269125,
        weight_kg: 7352.98,
        volume_cbm: 24.68,
        cargo_description: "Cholera kits and Tents",
        freight_carrier: "Kenya Airways",
        cost_usd: 18681,
        transit_days: 6,
        on_time: true,
        forwarder: "Kuehne Nagel"
    },
    {
        request_reference: "SR_24-002_NBO hub_Zambia_(SR_23-144)",
        origin: "Nairobi, Kenya",
        origin_longitude: 36.990054,
        origin_latitude: -1.2404475,
        destination: "Lusaka, Zambia",
        destination_longitude: 28.3174378,
        destination_latitude: -15.4136414,
        weight_kg: 14397.00,
        volume_cbm: 50.88,
        cargo_description: "Cholera kitsORSBody bagsMasks and Glucometers",
        freight_carrier: "Kenya Airways",
        cost_usd: 35000,
        transit_days: 20,
        on_time: true,
        forwarder: "Kuehne Nagel"
    },
    {
        request_reference: "SR_24-003_NBO hub_Zambia",
        origin: "Nairobi, Kenya",
        origin_longitude: 36.990054,
        origin_latitude: -1.2404475,
        destination: "Lusaka, Zambia",
        destination_longitude: 28.3174378,
        destination_latitude: -15.4136414,
        weight_kg: 10168.00,
        volume_cbm: 59.02,
        cargo_description: "Tents GlovesPPEs and Drugs",
        freight_carrier: "Kenya Airways",
        cost_usd: 56800,
        transit_days: 12,
        on_time: true,
        forwarder: "Kuehne Nagel"
    },
    {
        request_reference: "SR_24-004_NBO hub_Zambia",
        origin: "Nairobi, Kenya",
        origin_longitude: 36.990054,
        origin_latitude: -1.2404475,
        destination: "Lusaka, Zambia",
        destination_longitude: 28.3174378,
        destination_latitude: -15.4136414,
        weight_kg: 5000.00,
        volume_cbm: 20.00,
        cargo_description: "Emergency Aid",
        freight_carrier: "DHL Aviation",
        cost_usd: 25000,
        transit_days: 7,
        on_time: true,
        forwarder: "DHL Global Forwarding"
    },
    {
        request_reference: "SR_24-005_NBO hub_Zambia",
        origin: "Nairobi, Kenya",
        origin_longitude: 36.990054,
        origin_latitude: -1.2404475,
        destination: "Lusaka, Zambia",
        destination_longitude: 28.3174378,
        destination_latitude: -15.4136414,
        weight_kg: 4500.00,
        volume_cbm: 15.00,
        cargo_description: "Pharma",
        freight_carrier: "Ethiopian Airlines",
        cost_usd: 22000,
        transit_days: 8,
        on_time: true,
        forwarder: "Siginon Logistics"
    },
    {
        request_reference: "SR_24-006_DXB_Zambia",
        origin: "Dubai, UAE",
        origin_longitude: 55.2708,
        origin_latitude: 25.2048,
        destination: "Lusaka, Zambia",
        destination_longitude: 28.3174378,
        destination_latitude: -15.4136414,
        weight_kg: 12000.00,
        volume_cbm: 40.00,
        cargo_description: "Heavy Equipment",
        freight_carrier: "Emirates SkyCargo",
        cost_usd: 45000,
        transit_days: 5,
        on_time: true,
        forwarder: "Scan Global Logistics"
    }
];

export const AVAILABLE_FORWARDERS: ForwarderInputDef[] = [
    { id: 'kuehne_nagel', name: 'Kuehne Nagel', defaultPrice: 18681, defaultDays: 6 },
    { id: 'dhl_global', name: 'DHL Global Forwarding', defaultPrice: 33865, defaultDays: 7 },
    { id: 'siginon', name: 'Siginon Logistics', defaultPrice: 32000, defaultDays: 8 },
    { id: 'scan_global', name: 'Scan Global Logistics', defaultPrice: 35000, defaultDays: 9 },
    { id: 'agility', name: 'Agility Logistics', defaultPrice: 37000, defaultDays: 10 }
];