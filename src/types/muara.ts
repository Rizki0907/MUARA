export type NavTabId =
  | 'overview'
  | 'spatial'
  | 'rag-routing'
  | 'benchmarks'
  | 'economics';

export type PeriodRegime = 'normal' | 'peak';

export interface TbbmHub {
  tbbm_id: string;
  name: string;
  region_corridor: string;
  lat: number;
  lon: number;
  capacity_kl: number;
  fleet_count: number;
  truck_16kl: number;
  truck_24kl: number;
  truck_32kl: number;
}

export interface KabKotaQuota {
  bps_code: number;
  kabkota_name: string;
  admin_type: string;
  centroid_lat: number;
  centroid_lon: number;
  primary_tbbm_id: string;
  primary_tbbm_name: string;
  population_bps: number;
  spbu_count: number;
  kuota_pertalite_jbkp_kl_yr: number;
  kuota_biosolar_jbt_kl_yr: number;
  total_kuota_bbm_subsidi_kl_yr: number;
  corridor_pressure_factor: number;
}

export interface ClusterRanking {
  Rank: number;
  cluster_id: string;
  cluster_name: string;
  Priority_Tier: string;
  MUARA_Score: number;
  U_Urgency_Score: number;
  D_Domino_Score: number;
  C_Collective_Score: number;
  A_Accessibility_Score: number;
  primary_tbbm_id: string;
  primary_tbbm_name: string;
  spbu_count: number;
  eligible_p1_count: number;
  eligible_p2_count: number;
  total_tank_capacity_kl: number;
  avg_daily_demand_kl: number;
  peak_daily_demand_kl: number;
  avg_dist_to_tbbm_km: number;
  avg_lead_time_hr: number;
  mean_ttd_hr: number;
  baseline_cascading_hrs_30d: number;
  centroid_lat: number;
  centroid_lon: number;
}

export interface IsolatedBottleneck {
  spbu_id: string;
  name: string;
  kabkota_name: string;
  lat: number;
  lon: number;
  road_class: string;
  nearest_tbbm_id: string;
  dist_to_tbbm_km: number;
  tbbm_lead_time_hr: number;
  tank_capacity_kl: number;
  avg_daily_demand_kl: number;
  safety_stock_buffer_pct: number;
  station_topology_status: string;
}

export interface SpbuStation {
  id: string;
  name: string;
  kab: string;
  cl: string;
  lbl: number;
  iso: boolean;
  buf: number;
  lat: number;
  lon: number;
  rc: string;
  maxTrk: number;
  tbbm: string;
  dist: number;
  lead: number;
  cap: number;
  dAvg: number;
  dPeak: number;
  qPert: number;
  qBio: number;
  p1: number;
  p2: number;
  reg: string;
  nbrs: number;
  spill: number;
}

export interface BenchClustering {
  Algorithm_Rank: number;
  Clustering_Model: string;
  Clusters_Formed: number;
  Outlier_SPBU_Detected: number;
  Road_Silhouette_Score: number;
  Davies_Bouldin_Index_DBI: number;
  Spillover_Containment_Ratio_Pct: number;
  Operational_Evaluation: string;
}

export interface BenchPrediction {
  Model_Rank: number;
  Model_Family: string;
  Model_Name: string;
  RMSE_Depletion_KL_Hr: number;
  RMSE_TTD_Hours: number;
  RMSE_TTD_Minutes: number;
  MAE_TTD_Hours: number;
  MAPE_Percent: number;
  R2_Score: number;
  Inference_Latency_ms: number;
  Key_Diagnostic: string;
}

export interface BenchRouting {
  Method_Rank: number;
  Routing_Method: string;
  Solver_Paradigm: string;
  Cascading_Stockout_Reduction_Pct: number;
  Emergency_Km_Saved_Per_Yr: number;
  Fleet_Compartment_Utilization_Pct: number;
  Total_Annual_Logistics_OPEX_Billion_IDR: number;
  AMT_Shift_Violation_Rate_Pct: number;
  Operational_Summary: string;
}

export interface CriticAhpWeight {
  Dimension_Code: string;
  Dimension_Name: string;
  CRITIC_Std_Sigma: number;
  CRITIC_Conflict_Sum: number;
  CRITIC_Info_Content_C: number;
  Weight_Equal: number;
  Weight_CRITIC_Objective: number;
  Weight_AHP_Operational: number;
  Weight_Hybrid_Exact: number;
  Weight_MUARA_Calibrated: number;
  AHP_Consistency_Ratio_CR: number;
  Spearman_Rho_vs_Hybrid: number;
}

export interface SensitivityScenario {
  Weight_Scheme: string;
  Demand_Scenario: string;
  Demand_Multiplier: number;
  Spearman_Rank_Correlation_Rho: number;
  Rank1_Cluster: string;
  Rank2_Cluster: string;
  Rank3_Cluster: string;
  Rank4_Cluster: string;
  Rank5_Cluster: string;
  Top1_Score: number;
  Top5_Mean_Score: number;
  Top5_Consistency_Pct: number;
  Model_A_NPV10_Billion_IDR: number;
  Model_B_NPV10_Billion_IDR: number;
  Model_C_NPV10_Billion_IDR: number;
}

export interface FinancialModel {
  Model_Code: string;
  Model_Name: string;
  System_Description: string;
  CAPEX_USD: number;
  CAPEX_Billion_IDR: number;
  OPEX_Annual_USD: number;
  OPEX_Annual_Billion_IDR: number;
  Cascading_Stockout_Reduction_Pct: number;
  Emergency_Km_Saved_Per_Yr: number;
  CO2e_Emission_Reduction_Ton_Yr: number;
  Carbon_Valuation_Million_IDR_Yr: number;
  Emergency_Dispatch_Savings_Billion_IDR: number;
  Lost_Margin_Recovery_Billion_IDR: number;
  Gross_Annual_Savings_Billion_IDR: number;
  Net_Annual_Benefit_CF_Billion_IDR: number;
  Payback_Period_Years: number;
  NPV_10Yr_WACC10_Billion_IDR: number;
  IRR_Estimated_Pct: number;
}

export interface CashflowYear {
  Model_Code: string;
  Year: number;
  Nominal_Cash_Flow_Billion_IDR: number;
  Discount_Factor_10Pct: number;
  Discounted_Cash_Flow_Billion_IDR: number;
  Cumulative_NPV_Billion_IDR: number;
}

export interface CvrptwRoute {
  route_id: string;
  tbbm_origin: string;
  target_cluster_id: string;
  target_corridor: string;
  assigned_truck_capacity_kl: number;
  multi_drop_stops: string;
  num_stops: number;
  min_station_ttd_hr: number;
  reactive_single_drop_km: number;
  cvrptw_optimized_km: number;
  distance_saved_km: number;
  unloading_settling_min: number;
  total_amt_shift_hr: number;
  hsse_shift_compliant: string;
}

export interface RagDocument {
  doc_id: string;
  category: string;
  trigger_condition: string;
  action_protocol: string;
  hsse_rule: string;
}

export interface SimulationTimelinePoint {
  h: number;
  t: string;
  rain: number;
  ciMean: number;
  spillTotal: number;
  stockouts: number;
}

export interface SimulationStationPoint {
  h: number;
  t: string;
  stk: number;
  db: number;
  sp: number;
  de: number;
  ttd: number;
  rain: number;
  ci: number;
  so: number;
  cl: string;
}

export interface SimulationBundle {
  timeline: SimulationTimelinePoint[];
  stations: Record<string, SimulationStationPoint[]>;
}

export type MapSelection =
  | { type: 'spbu'; data: SpbuStation }
  | { type: 'cluster'; data: ClusterRanking }
  | { type: 'tbbm'; data: TbbmHub }
  | { type: 'kabkota'; data: KabKotaQuota };

