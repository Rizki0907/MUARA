# MUARA — Multi-agent Collective Intelligence for Adaptive Fuel Routing and Availability

Web Decision Support System & Riset Operasional untuk mitigasi *cascading stockout* BBM penugasan/subsidi (Pertalite & Biosolar) serta optimalisasi armada mobil tangki **PT Pertamina Patra Niaga Regional Jatimbalinus** (38 Kab/Kota · 7 TBBM · 920 SPBU · 11,34 juta KL/tahun), disusun untuk **Indonesia Knowledge Management Summit (IKMS) 2026**.

## Fitur Utama Dashboard
- **Command Overview & Peta Spasial Interaktif (WGS84 / OSRM):** Eksplorasi seluruh 38 poligon Kab/Kota Jawa Timur, 7 TBBM, 38 kluster penyangga HDBSCAN, 18 *Isolated Bottleneck SPBU* (`+20% safety buffer`), 920 titik SPBU, dan rute CVRPTW dengan *Telemetry Inspector* serta `Ctrl+K` *Command Palette*.
- **Simulator Modified Huff Spillover & Dinamika TTD:** Eksperimen interaktif parameter peluruhan waktu tempuh ($\beta$), retensi jaringan ($\gamma$), dan intensitas guncangan untuk melihat redistribusi probabilitas limpahan $P(i \to j)$ serta kurva simulasi Digital Twin 2-jam.
- **RAG Dispatcher Copilot (Human-in-the-Loop) & MILP CVRPTW:** Pemadanan laporan lapangan kolektif AMT/SPBU terhadap korpus SOP Pertamina Patra Niaga, persetujuan dispatcher ($I_{\text{approve}}=1$) untuk pembaruan bobot jalan dinamis $d'_{\text{OSRM}}$, insentif antrean MyPertamina, serta inspeksi 45 rute multi-kompartemen patuh HSSE $\le 8$ jam.
- **Multi-Model Benchmarking & Hybrid CRITIC-AHP:** Evaluasi komparatif 5 algoritma klustering, 7 model prediksi TTD, 4 solver rute, pengubah rasio bobot $\theta$ interaktif ($CR = 0,0042$), dan uji ketahanan 15 skenario ($\rho \ge 0,9667$).
- **Studi Ablasi & Tekno-Ekonomi ESG 10 Tahun:** Perbandingan Model A, B, dan C pada WACC 10% (NPV Rp92,26 Miliar, Payback 1,02 tahun, reduksi 719,9 ton $\text{CO}_2\text{e}$/tahun).

## Menjalankan Secara Lokal
```bash
npm install
python scripts/prepare_data.py
npm run dev
```

## Build Produksi
```bash
npm run build
```

