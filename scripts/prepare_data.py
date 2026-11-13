import csv
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "Assets MUARA"
OUT_DATA = ROOT / "src" / "data"
OUT_BRAND = ROOT / "public" / "brand"

OUT_DATA.mkdir(parents=True, exist_ok=True)
OUT_BRAND.mkdir(parents=True, exist_ok=True)


def to_num(val: str):
    if val is None or val == "":
        return None
    try:
        if "." in val:
            return float(val)
        return int(val)
    except ValueError:
        return val


def read_csv_typed(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({k: to_num(v.strip()) if isinstance(v, str) else v for k, v in row.items()})
        return rows


def process_logos():
    # Light mode: crop tightly & convert solid white background to transparent
    light_src = ASSETS / "06_Brand_Logo" / "logo_lightmode.jpeg"
    if light_src.exists():
        img = Image.open(light_src).convert("RGBA")
        px = img.load()
        w, h = img.size
        min_x, min_y, max_x, max_y = w, h, 0, 0
        for y in range(h):
            for x in range(w):
                r, g, b, _ = px[x, y]
                lum = (r + g + b) / 3.0
                sat = max(r, g, b) - min(r, g, b)
                if lum > 242 and sat < 18:
                    px[x, y] = (r, g, b, 0)
                else:
                    if lum > 215 and sat < 18:
                        alpha = int(max(0, min(255, (242 - lum) / 27.0 * 255)))
                        px[x, y] = (r, g, b, alpha)
                    if x < min_x: min_x = x
                    if y < min_y: min_y = y
                    if x > max_x: max_x = x
                    if y > max_y: max_y = y
        pad = 16
        cropped = img.crop((max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + pad), min(h, max_y + pad)))
        cw, ch = cropped.size
        if cw > 720:
            cropped = cropped.resize((720, int(ch * 720 / cw)), Image.Resampling.LANCZOS)
        cropped.save(OUT_BRAND / "logo-light.png", optimize=True)

    # Dark mode: crop tightly & convert solid obsidian background to transparent
    dark_src = ASSETS / "06_Brand_Logo" / "logo_Darkmode.jpeg"
    if dark_src.exists():
        img = Image.open(dark_src).convert("RGBA")
        px = img.load()
        w, h = img.size
        min_x, min_y, max_x, max_y = w, h, 0, 0
        for y in range(h):
            for x in range(w):
                r, g, b, _ = px[x, y]
                mx = max(r, g, b)
                if mx < 22:
                    px[x, y] = (r, g, b, 0)
                else:
                    if mx < 45:
                        alpha = int(max(0, min(255, (mx - 22) / 23.0 * 255)))
                        px[x, y] = (r, g, b, alpha)
                    if x < min_x: min_x = x
                    if y < min_y: min_y = y
                    if x > max_x: max_x = x
                    if y > max_y: max_y = y
        pad = 16
        cropped = img.crop((max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + pad), min(h, max_y + pad)))
        cw, ch = cropped.size
        if cw > 720:
            cropped = cropped.resize((720, int(ch * 720 / cw)), Image.Resampling.LANCZOS)
        cropped.save(OUT_BRAND / "logo-dark.png", optimize=True)


def main():
    process_logos()

    # 1. GeoJSON polygons (simplify coordinates slightly to 4 decimal places for compact bundle)
    geo_path = ASSETS / "01_Datasets_Master" / "jatim_38kabkota_polygons.geojson"
    geo = json.loads(geo_path.read_text(encoding="utf-8"))

    def round_coords(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], 4), round(coords[1], 4)]
        return [round_coords(c) for c in coords]

    for feat in geo.get("features", []):
        feat["geometry"]["coordinates"] = round_coords(feat["geometry"]["coordinates"])
    (OUT_DATA / "jatim_polygons.json").write_text(json.dumps(geo, separators=(",", ":")), encoding="utf-8")

    # 2. TBBM & Kab/Kota quotas
    tbbms = read_csv_typed(ASSETS / "01_Datasets_Master" / "tbbm_jatim.csv")
    quotas = read_csv_typed(ASSETS / "01_Datasets_Master" / "kuota_bbm_jatim_38kabkota.csv")
    (OUT_DATA / "tbbm.json").write_text(json.dumps(tbbms, indent=2), encoding="utf-8")
    (OUT_DATA / "quotas.json").write_text(json.dumps(quotas, indent=2), encoding="utf-8")

    # 3. Clusters & Bottlenecks
    clusters = read_csv_typed(ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_all_clusters_ranking.csv")
    bottlenecks = read_csv_typed(ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_isolated_bottleneck_spbu.csv")
    (OUT_DATA / "clusters.json").write_text(json.dumps(clusters, indent=2), encoding="utf-8")
    (OUT_DATA / "bottlenecks.json").write_text(json.dumps(bottlenecks, indent=2), encoding="utf-8")

    # 4. Compact 920 SPBUs (keep fields needed for map, inspector, Huff simulator, search)
    spbu_raw = read_csv_typed(ASSETS / "01_Datasets_Master" / "spbu_jatimbalinus_920.csv")
    spbu_compact = []
    for s in spbu_raw:
        spbu_compact.append({
            "id": s["spbu_id"],
            "name": s["name"],
            "kab": s["kabkota_name"],
            "cl": s["cluster_id"],
            "lbl": s["hdbscan_label"],
            "iso": s["hdbscan_label"] == -1,
            "buf": s["safety_stock_buffer_pct"],
            "lat": round(float(s["lat"]), 5),
            "lon": round(float(s["lon"]), 5),
            "rc": s["road_class"],
            "maxTrk": s["max_allowed_truck_kl"],
            "tbbm": s["nearest_tbbm_id"],
            "dist": s["dist_to_tbbm_km"],
            "lead": s["tbbm_lead_time_hr"],
            "cap": s["tank_capacity_kl"],
            "dAvg": s["avg_daily_demand_kl"],
            "dPeak": s["peak_daily_demand_kl"],
            "qPert": s["bph_quota_pertalite_kl_yr"],
            "qBio": s["bph_quota_biosolar_kl_yr"],
            "p1": s["eligible_period_1_normal"],
            "p2": s["eligible_period_2_peak"],
            "reg": s["vulnerability_regime"],
            "nbrs": s["neighbors_within_15min"],
            "spill": s["out_spillover_centrality"],
        })
    (OUT_DATA / "spbus.json").write_text(json.dumps(spbu_compact, separators=(",", ":")), encoding="utf-8")

    # 5. Benchmarks, CRITIC-AHP, Sensitivity, Financials, Cashflow, Routes, RAG KB
    datasets_map = {
        "bench_clustering.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "benchmark_clustering_models.csv",
        "bench_prediction.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "benchmark_prediction_models.csv",
        "bench_routing.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "benchmark_routing_models.csv",
        "critic_ahp.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_critic_ahp_weights.csv",
        "sensitivity.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_sensitivity_test.csv",
        "financials.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_financial_evaluation_models.csv",
        "cashflow.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_10yr_cashflow_schedule.csv",
        "routes.json": ASSETS / "02_Hasil_Pemodelan_CSV" / "muara_cvrptw_routes_sample.csv",
    }
    for out_name, src in datasets_map.items():
        (OUT_DATA / out_name).write_text(json.dumps(read_csv_typed(src), indent=2), encoding="utf-8")

    rag_src = ASSETS / "01_Datasets_Master" / "muara_rag_knowledge_base.json"
    (OUT_DATA / "rag_kb.json").write_text(rag_src.read_text(encoding="utf-8"), encoding="utf-8")

    # 6. Hourly simulation (aggregate + sample top critical stations for interactive cascade chart)
    sim_raw = read_csv_typed(ASSETS / "01_Datasets_Master" / "spbu_hourly_simulation.csv")
    # Build system-wide 30-day cumulative curve & per-station series for top 8 stations
    by_spbu = {}
    hourly_agg = {}
    for row in sim_raw:
        sid = row["spbu_id"]
        hr = int(row["hour"])
        by_spbu.setdefault(sid, []).append({
            "h": hr,
            "t": row["timestamp"],
            "stk": row["stock_actual_kl"],
            "db": row["d_base_kl_hr"],
            "sp": row["spillover_kl_hr"],
            "de": row["d_eff_kl_hr"],
            "ttd": row["ttd_hours"],
            "rain": row["precipitation_mm"],
            "ci": row["ci_signal_score"],
            "so": row["is_cascading_stockout"],
            "cl": row["cluster_id"],
        })
        agg = hourly_agg.setdefault(hr, {"h": hr, "t": row["timestamp"], "rain": 0.0, "ci": 0.0, "sp": 0.0, "so": 0, "n": 0})
        agg["rain"] = max(agg["rain"], float(row["precipitation_mm"]))
        agg["ci"] += float(row["ci_signal_score"])
        agg["sp"] += float(row["spillover_kl_hr"])
        agg["so"] += int(row["is_cascading_stockout"])
        agg["n"] += 1

    # Pick 6 representative high-activity stations (different clusters) for interactive inspection
    sorted_spbus = sorted(by_spbu.items(), key=lambda kv: sum(x["sp"] for x in kv[1]), reverse=True)[:8]
    sim_bundle = {
        "timeline": [
            {
                "h": v["h"],
                "t": v["t"],
                "rain": round(v["rain"], 2),
                "ciMean": round(v["ci"] / max(1, v["n"]), 1),
                "spillTotal": round(v["sp"], 2),
                "stockouts": v["so"],
            }
            for v in sorted(hourly_agg.values(), key=lambda x: x["h"])
        ],
        "stations": {k: v for k, v in sorted_spbus},
    }
    (OUT_DATA / "simulation.json").write_text(json.dumps(sim_bundle, separators=(",", ":")), encoding="utf-8")
    print("Prepared all MUARA data assets & logos successfully.")


if __name__ == "__main__":
    main()
