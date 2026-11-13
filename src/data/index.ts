import type {
  BenchClustering,
  BenchPrediction,
  BenchRouting,
  CashflowYear,
  ClusterRanking,
  CriticAhpWeight,
  CvrptwRoute,
  FinancialModel,
  IsolatedBottleneck,
  KabKotaQuota,
  RagDocument,
  SensitivityScenario,
  SimulationBundle,
  SpbuStation,
  TbbmHub,
} from '../types/muara';

import jatimPolygonsJson from './jatim_polygons.json';
import tbbmJson from './tbbm.json';
import quotasJson from './quotas.json';
import clustersJson from './clusters.json';
import bottlenecksJson from './bottlenecks.json';
import spbusJson from './spbus.json';
import benchClusteringJson from './bench_clustering.json';
import benchPredictionJson from './bench_prediction.json';
import benchRoutingJson from './bench_routing.json';
import criticAhpJson from './critic_ahp.json';
import sensitivityJson from './sensitivity.json';
import financialsJson from './financials.json';
import cashflowJson from './cashflow.json';
import routesJson from './routes.json';
import ragKbJson from './rag_kb.json';
import simulationJson from './simulation.json';

export const jatimPolygons = jatimPolygonsJson as GeoJSON.FeatureCollection;
export const tbbmHubs = tbbmJson as TbbmHub[];
export const kabKotaQuotas = quotasJson as KabKotaQuota[];
export const clustersRanking = clustersJson as ClusterRanking[];
export const isolatedBottlenecks = bottlenecksJson as IsolatedBottleneck[];
export const allSpbus = spbusJson as SpbuStation[];
export const benchClustering = benchClusteringJson as BenchClustering[];
export const benchPrediction = benchPredictionJson as BenchPrediction[];
export const benchRouting = benchRoutingJson as BenchRouting[];
export const criticAhpWeights = criticAhpJson as CriticAhpWeight[];
export const sensitivityScenarios = sensitivityJson as SensitivityScenario[];
export const financialModels = financialsJson as FinancialModel[];
export const cashflowSchedule = cashflowJson as CashflowYear[];
export const cvrptwRoutes = routesJson as CvrptwRoute[];
export const ragKnowledgeBase = ragKbJson as RagDocument[];
export const simulationBundle = simulationJson as SimulationBundle;

