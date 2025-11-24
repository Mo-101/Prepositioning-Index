export interface Country {
  iso: string;
  name: string;
  inform_base: number;
  ghs_base: number;
  population: number;
  priority: 1 | 2 | 3;
}

export interface RiskPrepData {
  country_iso: string;
  date: Date;
  inform_risk: number;
  inform_vulnerability: number;
  ghs_preparedness: number;
}

export interface OutbreakData {
  country_iso: string;
  date: Date;
  disease: string;
  cases: number;
}

export interface PiScore {
  country_iso: string;
  date: Date;
  pi_scores: { [key in Hazard]?: number };
  priorityScore: number; // For MCDM model output
  risk_norm: number;
  preparedness_norm: number;
  vulnerability_norm: number;
  outbreak_norms: { [key in Hazard]?: number };
}

export interface ForecastPoint {
  date: Date;
  forecast: number;
  lower_ci: number;
  upper_ci: number;
}

export interface Scenario {
  country: string;
  disease: string;
  population_at_risk: number;
  attack_rate_percent: number;
  severity_ratio_severe_percent: number;
  narrative: string;
  estimationParams: EstimationParams;
}

export interface CommodityDetail {
  commodity_id: string;
  who_description: string;
  item_category: string;
  unit_cost_usd: number;
  avg_lead_time_days: number;
}

export interface Inventory {
  commodity_id: string;
  stock_on_hand: number;
  quantity_in_pipeline: number;
}

export interface KitContent {
  kit_code: string;
  commodity_id: string;
  quantity_per_kit: number;
}

export interface ReplenishmentItem {
  scenario: any;
  commodity_id: string;
  who_description: string;
  gross_need: number;
  stock_on_hand: number;
  quantity_in_pipeline: number;
  quantity_to_ship: number;
  estimated_cost_usd: number;
  avg_lead_time_days: number;
}

export interface RiskPillar {
    name: 'Collaborative Surveillance' | 'Community Vulnerability' | 'System Capacity & Readiness' | 'Logistical & Geographic Risk';
    value: number;
    color: string;
}

export interface Shipment {
    id: string;
    commodity_id: string;
    quantity: number;
    status: 'In Transit' | 'Delivered' | 'Pending';
    dispatch_date: Date;
    eta: Date;
    hazard: Hazard;
}

export interface ItemNeed {
    id?: string;
    description: string;
    category: string;
    need: number;
    unit: string;
    assumption: string;
    cost?: number;
}

export interface HumanResourceNeed {
    profile: string;
    need: number;
    variable: string;
    value: string;
}

export interface EstimationParams {
    number_of_beds: number;
    expected_patients_per_week: number;
    period_weeks: number;
}

export interface HazardData {
    params: EstimationParams;
    medicines: ItemNeed[];
    devices: ItemNeed[];
    ppe: ItemNeed[];
    logistics: ItemNeed[];
    hr: HumanResourceNeed[];
}

export interface WeeklyDemand {
    week: number;
    week_start_date: string;
    demand: number;
}

export interface InventoryProjectionPoint {
    week: number;
    date: string;
    level: number;
}

export interface EventModifier {
    name: string;
    multiplier: number;
    description: string;
}

export type View = 'dashboard' | 'supplyChain' | 'planning';

export type Hazard = 'cholera' | 'ebola' | 'mpox' | 'lassa' | 'diphtheria';