<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=280&color=0:0F172A,50:2563EB,100:14B8A6&text=SIMKEMAS&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Enterprise%20Resource%20Planning%20%7C%20Point%20of%20Sales%20%7C%20Production%20Workflow&descAlignY=60"/>

# 🚀 SIMKEMAS

### Enterprise Resource Planning (ERP) & Point of Sales untuk Pusat Layanan Kemasan UMKM

<p>

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)

![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)

![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

</p>

</div>

---

# ✨ Tentang SIMKEMAS

SIMKEMAS adalah platform **Enterprise Resource Planning (ERP)** sekaligus **Point of Sales (POS)** yang dirancang khusus untuk **Pusat Layanan Kemasan UMKM**.

Sistem ini mengintegrasikan seluruh proses bisnis mulai dari **pemesanan pelanggan**, **workflow produksi lintas divisi**, **manajemen keuangan**, hingga **dashboard analitik** dalam satu platform berbasis cloud.

## 🎯 Keunggulan

- 🚀 ERP & POS dalam satu aplikasi
- 🏭 Workflow Produksi Multi Divisi
- 📊 Dashboard Analitik Real-time
- 💰 Manajemen Keuangan
- 📦 Manajemen Pesanan
- 👥 Customer Management
- 🔐 Role Based Access Control (RBAC)
- ☁️ Cloudflare Serverless Architecture

---

# 🖥️ Preview

> Ganti gambar berikut dengan screenshot aplikasi Anda.

<p align="center">

<img src="./docs/images/dashboard.png" width="95%">

</p>

---

# 📦 Modul Utama

## 🛒 Point of Sales

- Pembuatan SPK
- Data Pelanggan
- Data Produk Kemasan
- Pembayaran DP
- Pelunasan
- Cicilan
- Cetak Invoice
- Riwayat Transaksi

---

## 🎨 Workflow Produksi

Menggunakan konsep **Kanban Workflow**.

```text
POS
 │
 ▼
Desain
 │
 ▼
Produksi
 │
 ▼
Packaging
 │
 ▼
Ready Pickup
```

### Divisi

🎨 Desain

- Drag & Drop
- Approval
- Upload File

🖨️ Produksi

- Monitoring Produksi
- Validasi Material
- Status Mesin

📦 Packaging

- Quality Control
- Packing
- Ready Pickup

---

# 📊 Dashboard

Dashboard menyediakan informasi bisnis secara real-time.

- 📈 Omzet
- 📦 SPK Aktif
- 👥 Data Pelanggan
- 💰 Cashflow
- ⭐ Produk Terlaris
- 📄 Export CSV

---

# 🔒 Keamanan

| Fitur | Status |
|-------|--------|
| Role Based Access Control | ✅ |
| Audit Log | ✅ |
| Permission Management | ✅ |
| Secure Authentication | ✅ |

---

# 🏗️ Arsitektur Sistem

```mermaid
flowchart LR

Client["🌐 React Frontend"]

API["⚡ Cloudflare Workers"]

DB[("🗄️ Cloudflare D1")]

R2["📁 Cloudflare R2"]

KV["⚡ KV Cache"]

Client --> API

API --> DB

API --> R2

API --> KV
```

---

# 🔄 Workflow Produksi

```mermaid
flowchart LR

A["🛒 POS"]

B["📄 SPK"]

C["🎨 Desain"]

D["🖨️ Produksi"]

E["📦 Packaging"]

F["💳 Pelunasan"]

G["✅ Selesai"]

A --> B

B --> C

C --> D

D --> E

E --> F

F --> G

style A fill:#2563EB,color:#fff
style B fill:#0EA5E9,color:#fff
style C fill:#8B5CF6,color:#fff
style D fill:#F97316,color:#fff
style E fill:#22C55E,color:#fff
style F fill:#14B8A6,color:#fff
style G fill:#16A34A,color:#fff
```

---

# ⚙️ Tech Stack

| Layer | Technology |
|---------|-----------------------------|
| Frontend | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| Icons | Lucide React |
| Workflow | Hello Pangea DnD |
| Architecture | Monorepo |

---

# 📁 Struktur Project

```text
📦 SIMKEMAS
│
├── 📁 apps
│   ├── 🌐 frontend
│   └── ⚡ backend
│
├── 📁 packages
│
├── 📁 docs
│   └── 🖼️ images
│
├── 📄 package.json
├── 📄 wrangler.jsonc
├── 📄 vite.config.ts
├── 📄 README.md
└── 📄 LICENSE
```

---

# 🚀 Quick Start

## Clone Repository

```bash
git clone https://github.com/viabdillah/simkemas.git
```

Masuk ke folder project

```bash
cd simkemas
```

Install dependency

```bash
npm install
```

Jalankan development server

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
Cloudflare Workers (Wrangler)
```

---

# 📈 Roadmap

| Status | Modul |
|---------|---------------------------|
| ✅ | Point of Sales |
| ✅ | Workflow Produksi |
| ✅ | Dashboard |
| ✅ | Keuangan |
| ✅ | Export CSV |
| 🚧 | WhatsApp Notification |
| 🚧 | Dashboard Mobile |
| 🚧 | QR Code |
| 🚧 | Multi Cabang |
| 🚧 | Backup Cloud |
| 🚧 | AI Analytics |

---

# 🤝 Kontribusi

Kontribusi sangat terbuka.

```text
Fork
   │
   ▼
Create Branch
   │
   ▼
Commit Changes
   │
   ▼
Push Branch
   │
   ▼
Pull Request
```

---

# 📜 Lisensi

Project ini menggunakan lisensi **MIT License**.

---

<div align="center">

### ⭐ SIMKEMAS

ERP • POS • Workflow Produksi • Dashboard Analytics

Dibangun menggunakan **React**, **Cloudflare Workers**, dan **Tailwind CSS**.

<br>

**© 2026 Divi Abdillah Almasrur**

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=180&section=footer&color=0:0F172A,50:2563EB,100:14B8A6"/>

</div>
