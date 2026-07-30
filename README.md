<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=280&color=0:0F172A,50:2563EB,100:14B8A6&text=SIMKEMAS&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Enterprise%20Resource%20Planning%20%7C%20Point%20of%20Sales%20%7C%20Production%20Workflow&descAlignY=60"/>

# 🚀 SIMKEMAS

### Enterprise Resource Planning (ERP) & Point of Sales untuk Pusat Layanan Kemasan UMKM

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

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

> Coming Soon.

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

```
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

| Fitur                     | Status |
| ------------------------- | ------ |
| Role Based Access Control | ✅      |
| Audit Log                 | ✅      |
| Permission Management     | ✅      |
| Secure Authentication     | ✅      |

---

# 🏗️ Arsitektur Sistem

```
flowchart LR

Client["🌐 React Frontend"]
API["⚡ Cloudflare Pages Functions"]
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

```
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

| Layer        | Technology                  |
| ------------ | ---------------------------- |
| Frontend     | React 19                     |
| Build Tool   | Vite 7                       |
| Styling      | Tailwind CSS v4               |
| Backend      | Cloudflare Pages Functions    |
| Database     | Cloudflare D1                 |
| Storage      | Cloudflare R2                 |
| Cache        | Cloudflare KV                  |
| Icons        | Lucide React                   |
| Workflow     | Hello Pangea DnD                |
| Architecture | Monorepo (npm workspaces)        |

---

# 📁 Struktur Project

```
📦 SIMKEMAS
│
├── 🌐 frontend              # React 19 + Vite + Tailwind CSS (punya package.json sendiri)
│
├── ⚡ backend               # Cloudflare Pages Functions (API)
│   └── functions
│       ├── _lib             # Helper (crypto, jwt, audit, dll)
│       └── api              # Endpoint API
│
├── 🔗 shared/src            # Tipe & util yang dipakai bersama FE-BE
│
├── 📄 package.json          # Root workspace config
├── 📄 .gitignore
├── 📄 README.md
└── 📄 LICENSE
```

> ℹ️ **Catatan:** `backend` tidak termasuk dalam npm workspace karena tidak memiliki dependency Node — murni Cloudflare Pages Functions yang dijalankan langsung oleh `wrangler`.

---

# 🚀 Quick Start

## Clone Repository

```
git clone https://github.com/viabdillah/simkemas.git
cd simkemas
```

## Install dependency (root + frontend workspace)

```
npm install
```

## Jalankan development server

Butuh 2 terminal terpisah:

**Terminal 1 — Frontend (Vite)**
```
cd frontend
npm run dev
```
→ http://localhost:5173

**Terminal 2 — Backend (Cloudflare Pages Functions)**
```
cd backend
wrangler pages dev functions --port 8788
```
→ http://localhost:8788

> 💡 Frontend memanggil API backend melalui proxy yang dikonfigurasi di `vite.config.js` (`/api` → backend lokal atau URL backend production, tergantung environment).

---

# 📈 Roadmap

| Status | Modul                 |
| ------ | --------------------- |
| ✅      | Point of Sales        |
| ✅      | Workflow Produksi     |
| ✅      | Dashboard             |
| ✅      | Keuangan              |
| ✅      | Export CSV            |
| 🚧      | WhatsApp Notification |
| 🚧      | Dashboard Mobile      |
| 🚧      | QR Code               |
| 🚧      | Multi Cabang          |
| 🚧      | Backup Cloud          |
| 🚧      | AI Analytics          |

---

# 🤝 Kontribusi

Kontribusi sangat terbuka.

```
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

### ⭐ SIMKEMAS

ERP • POS • Workflow Produksi • Dashboard Analytics

Dibangun menggunakan **React**, **Cloudflare Workers**, dan **Tailwind CSS**.

**© 2026 Divi Abdillah Almasrur**

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=180&section=footer&color=0:0F172A,50:2563EB,100:14B8A6"/>

</div>
