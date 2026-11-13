# PANDUAN SINKRONISASI ANGKA EKSAK V2.0: ABSTRAK, KOMPARASI MULTI-MODEL & BAB 4 FULL PAPER MUARA (IKMS 2026)

Dokumen ini merangkum seluruh angka hasil eksekusi *end-to-end* **MUARA Versi 2.0** (`seed=42`) setelah mengimplementasikan **6 Perbaikan Audit Metodologis & Visual** pada koridor jaringan darat terintegrasi **PT Pertamina Patra Niaga Regional Jatimbalinus (Provinsi Jawa Timur: 38 Kabupaten/Kota, 7 TBBM, dan 920 SPBU)**.

---

## 1. Draf Abstrak Terkalibrasi V2.0 (Siap Salin ke Full Paper)

**Abstrak (Bahasa Indonesia):**  
Distribusi bahan bakar minyak (BBM) penugasan dan bersubsidi (Pertalite JBKP dan Biosolar JBT) di bawah naungan PT Pertamina Patra Niaga Regional Jatimbalinus menghadapi kerentanan efek domino kekosongan stok berantai (*cascading stockout*) ketika lonjakan permintaan di satu SPBU arteri meluber ke SPBU tetangga. Penelitian ini merancang **MUARA**, sistem pendukung keputusan spasial berbasis *Collective Intelligence* dan *Retrieval-Augmented Generation* (RAG) pada jaringan darat terintegrasi Provinsi Jawa Timur yang mencakup **38 Kabupaten/Kota, 7 Terminal BBM (TBBM), dan 920 SPBU** dengan total alokasi kuota BPH Migas sebesar **11.340.955,3 KL/tahun**. Melalui protokol *Multi-Model Benchmarking* terhadap lima algoritma klustering spasial pada matriks jarak jalan raya OSRM, **HDBSCAN** terpilih sebagai model terbaik (*Road Silhouette Score* **0,678**, *Davies-Bouldin Index* **0,624**, dan *Spillover Containment Ratio* **94,2%**), membentuk **38 kluster penyangga** sekaligus mengisolasi **18 *Isolated Bottleneck SPBU* (`label = -1`)** di jalur lintas selatan dan pantura renggang yang diwajibkan memiliki *Safety Stock Buffer* ekstra **+20%** (ambang pemesanan ulang pada stok 30%). Pada pemodelan *Modified Huff Gravity Spillover* ($\alpha=1,0; \beta=0,35; \gamma=0,82$) dan pengujian tujuh model *Machine Learning* serta *Deep Learning* (5-Fold *Time-Series Split*), **Spatio-Temporal XGBoost Regressor** mencapai akurasi tertinggi dalam memprediksi *Time-to-Depletion* (TTD) dengan **RMSE 2,391 jam (143,5 menit)**, **MAE 1,266 jam**, **MAPE 8,61%**, **$R^2 = 0,9759$**, dan latensi inferensi **11,2 ms** (**12,7 kali lebih cepat** dibanding *Bidirectional LSTM* pada 142,0 ms). Pembobotan multi-kriteria **Hybrid CRITIC–AHP** ($\text{CR} = 0,0042 < 0,05$) membuktikan secara matematis konvergensi bobot Urgensi Stok ($0,30$), Dampak Domino ($0,30$), *Collective Intelligence* ($0,20$), dan Aksesibilitas TBBM ($0,20$), menetapkan **8 kluster Tier-1 kritis** yang dipimpin oleh **CL_36 (Jember Kota & Tanggul, skor 95,02)**, **CL_01 (Surabaya Pusat & Tanjung Perak, skor 72,75)**, dan **CL_04 (Sidoarjo Waru & Bandara Juanda, skor 68,50)** dengan konsistensi peringkat Top 5 sebesar **100%** dan korelasi peringkat Spearman **$\rho \ge 0,9667$** di seluruh 15 skenario sensitivitas. Komparasi empat metode optimasi rute membuktikan keunggulan **MILP OR-Tools CVRPTW berbantuan RAG Dispatcher** (Model C) yang menurunkan insiden *cascading stockout* sebesar **91,4%** (dari 7.250 menjadi 624 insiden), menghemat perjalanan darurat **782.500 km/tahun**, meningkatkan utilisasi kompartemen truk menjadi **94,8%** dengan kepatuhan jam kerja AMT $\le 8$ jam sebesar **100%**, serta mereduksi emisi **719,9 ton $\text{CO}_2\text{e}$/tahun**. Evaluasi tekno-ekonomi selama 10 tahun (WACC 10%) menunjukkan bahwa dengan CAPEX **USD 1.150.000 (Rp18,40 Miliar)** dan OPEX **USD 240.000/tahun (Rp3,84 Miliar/tahun)**, sistem *Full MUARA* menghasilkan manfaat bersih tahunan (**$CF_t$**) **Rp18,01 Miliar/tahun**, *Payback Period* **1,02 tahun**, dan **NPV 10 tahun sebesar Rp92,26 Miliar**.

---

## 2. Empat Tabel Komparasi Multi-Model Baru (Bab 4 Full Paper V2.0)

### 2.1 Tabel Komparasi 5 Algoritma Klustering Spasial (`benchmark_clustering_models.csv`)
| Peringkat | Model Klustering Spasial | Jml Kluster | Outlier SPBU Terdeteksi | Road Silhouette Score | Davies-Bouldin Index (DBI) | Spillover Containment Ratio (SCR %) | Evaluasi Operasional Rantai Pasok BBM |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **#1** | **HDBSCAN + Excess of Mass (MUARA Terpilih)** | **38** | **18 (`label = -1`)** | **0,678** | **0,624** | **94,2%** | **Terbaik:** Menangkap 94,2% *spillover* dalam kluster & mendeteksi 18 *Isolated Bottleneck SPBU* (+20% *Safety Buffer*) |
| **#2** | Leiden Graph Community Detection (k-NN Road $k=8$) | 36 | 0 | 0,594 | 0,812 | 88,5% | Mengikuti topologi jalan raya, namun gagal memisahkan SPBU terisolasi (*Single-Point-of-Failure*) |
| **#3** | OPTICS ($\xi=0,04$, $\text{min\_samples}=10$) | 34 | 47 | 0,538 | 0,964 | 83,8% | Adaptif terhadap variasi kepadatan, namun batas kluster kurang stabil pada koridor arteri memanjang |
| **#4** | K-Medoids / PAM ($k=38$, OSRM Road Metric) | 38 | 0 | 0,486 | 1,142 | 78,6% | Partisi bulat kaku; memaksa SPBU lintas selatan bergabung ke kluster kota tanpa *buffer* khusus |
| **#5** | DBSCAN Konvensional ($\epsilon=12\text{ km}$, $\text{minPts}=8$) | 21 | 114 | 0,412 | 1,385 | 71,4% | Gagal memisahkan aglomerasi padat Surabaya Raya & membuang terlalu banyak SPBU pedesaan |

---

### 2.2 Tabel Komparasi 7 Model Prediksi Time-to-Depletion ML & DL (`benchmark_prediction_models.csv`)
| Peringkat | Kategori Model | Nama Model Prediksi TTD | RMSE Laju Kuras (KL/jam) | RMSE TTD (Jam) | RMSE TTD (Menit) | MAE TTD (Jam) | MAPE (%) | $R^2$ Score | Latensi Inferensi (ms) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **#1** | **Physics-Informed GBDT** | **Spatio-Temporal XGBoost + Huff + CI (MUARA)** | **0,214** | **2,391** | **143,5** | **1,266** | **8,61%** | **0,9759** | **11,2 ms** |
| **#2** | Deep Learning Sequence | Bidirectional LSTM (2-Layer, 64 Units, 24h Window) | 0,236 | 2,512 | 150,7 | 1,348 | 9,18% | 0,9734 | 142,0 ms |
| **#3** | Gradient Boosting | CatBoost Regressor (Symmetric Trees, depth=6) | 0,248 | 2,680 | 160,8 | 1,435 | 9,72% | 0,9697 | 14,5 ms |
| **#4** | Gradient Boosting | LightGBM Regressor (Leaf-wise, leaves=31) | 0,264 | 2,845 | 170,7 | 1,542 | 10,45% | 0,9658 | 8,6 ms |
| **#5** | Bagging Ensemble | Random Forest Regressor (200 Trees, Spatial Only) | 0,428 | 4,928 | 295,7 | 2,708 | 17,48% | 0,8975 | 28,4 ms |
| **#6** | Linear Regularized | Ridge Regression ($L_2$ Penalty, $\alpha=1,0$) | 0,615 | 7,145 | 428,7 | 4,210 | 21,85% | 0,7842 | 1,8 ms |
| **#7** | Baseline Operasional | Historical Moving Average (Single-Silo) | 0,842 | 10,017 | 601,0 | 5,984 | 28,94% | 0,5766 | 1,2 ms |

---

### 2.3 Tabel Penurunan Matematis Bobot Hibrida CRITIC–AHP (`muara_critic_ahp_weights.csv`)
| Kode | Dimensi Evaluasi Kluster MUARA | Simpangan Baku Kontras ($\sigma_m$) | Total Konflik Korelasi $\sum(1-r_{mn})$ | Muatan Informasi CRITIC ($C_m$) | Bobot Objektif CRITIC ($w_m^{\text{CRITIC}}$) | Bobot Operasional AHP ($w_m^{\text{AHP}}$) | Sintesis Hibrida Eksak (50:50) | Bobot Terkalibrasi MUARA |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U** | Urgensi Stok Tangki Pendam | 0,2480 | 1,5850 | 0,3931 | 0,2724 | 0,3182 | 0,2953 | **0,30 (30%)** |
| **D** | Dampak Domino Spillover | 0,2540 | 1,5800 | 0,4013 | 0,2781 | 0,3182 | 0,2981 | **0,30 (30%)** |
| **C** | Intensitas Collective Intelligence | 0,2120 | 1,4250 | 0,3021 | 0,2093 | 0,1818 | 0,1956 | **0,20 (20%)** |
| **A** | Kerentanan Aksesibilitas TBBM | 0,2180 | 1,5900 | 0,3466 | 0,2402 | 0,1818 | 0,2110 | **0,20 (20%)** |

* **Parameter Validasi Matriks AHP & Korelasi Spearman ($\rho$):** $\lambda_{\max} = 4,011$, *Consistency Index* ($\text{CI}$) $= 0,0038$, **Consistency Ratio ($\text{CR}$) $= 0,0042 < 0,05$** (Sangat Konsisten). Korelasi peringkat Spearman terhadap bobot Hibrida Final mencapai **$\rho = 0,9989$** (CRITIC Murni), **$\rho = 0,9982$** (AHP Murni), dan **$\rho = 0,9915$** (*Equal Weight*).

---

### 2.4 Tabel Komparasi 4 Metode Optimasi Rute Armada Mobil Tangki (`benchmark_routing_models.csv`)
| Peringkat | Metode Optimasi Penjadwalan Armada | Paradigma Solver | Reduksi Cascading Stockout (%) | Penghematan Km Darurat (km/thn) | Utilisasi Kompartemen Truk (%) | Pelanggaran Shift AMT > 8 Jam (%) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **#1** | **MILP OR-Tools CVRPTW + Guided Local Search + RAG (MUARA Model C)** | **Exact Time-Window MILP + Dynamic CI/RAG Re-Routing** | **91,4%** | **782.500 km** | **94,8%** | **0,0% (100% Patuh HSSE)** |
| **#2** | Genetic Algorithm Metaheuristic VRP ($\text{Pop}=100, \text{Gen}=250$) | Evolutionary Global Search (Setara Model B Tanpa RAG) | 68,2% | 485.000 km | 86,4% | 1,9% |
| **#3** | Greedy Nearest-Neighbor Heuristic VRP | Local Distance Minimization (Myopic Dispatch) | 46,8% | 298.500 km | 76,5% | 6,8% |
| **#4** | Reactive First-Come First-Served (FCFS — Baseline Model A) | Static Single-Drop Dispatch (<15% Threshold) | 24,5% | 125.400 km | 64,2% | 11,4% |

---

## 3. Ringkasan Evaluasi Tekno-Ekonomi 3 Skenario (`muara_financial_evaluation_models.csv`)

| Komponen Evaluasi | Model A (Reactive Baseline) | Model B (Spatial AI Only) | Model C (Full MUARA System) |
| :--- | :---: | :---: | :---: |
| **CAPEX Awal** | USD 180.000 (**Rp2,88 Miliar**) | USD 620.000 (**Rp9,92 Miliar**) | USD 1.150.000 (**Rp18,40 Miliar**) |
| **OPEX Tahunan** | USD 35.000 (**Rp0,56 Miliar/thn**) | USD 110.000 (**Rp1,76 Miliar/thn**) | USD 240.000 (**Rp3,84 Miliar/thn**) |
| **Reduksi Cascading Stockout** | **24,5%** (sisa 5.474 insiden) | **68,2%** (sisa 2.305 insiden) | **91,4%** (sisa 624 insiden) |
| **Penghematan Jarak Darurat** | **125.400 km/tahun** | **485.000 km/tahun** | **782.500 km/tahun** |
| **Reduksi Emisi Karbon Armada** | **115,3 ton $\text{CO}_2\text{e}$/tahun** | **446,2 ton $\text{CO}_2\text{e}$/tahun** | **719,9 ton $\text{CO}_2\text{e}$/tahun** |
| **Gross Annual Savings** | **Rp3,12 Miliar/tahun** | **Rp12,45 Miliar/tahun** | **Rp21,85 Miliar/tahun** |
| **Net Annual Benefit ($CF_t$)** | **Rp2,56 Miliar/tahun** | **Rp10,69 Miliar/tahun** | **Rp18,01 Miliar/tahun** |
| **Payback Period** | **1,12 Tahun** | **0,93 Tahun** | **1,02 Tahun** |
| **NPV 10 Tahun (WACC 10%)** | **Rp12,85 Miliar** | **Rp55,77 Miliar** | **Rp92,26 Miliar** |
