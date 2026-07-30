# ![Header](https://capsule-render.vercel.app/api?type=waving\&height=280\&color=0:0F172A,50:2563EB,100:14B8A6\&text=SIMKEMAS\&fontSize=60\&fontColor=ffffff\&animation=fadeIn\&fontAlignY=38\&desc=Enterprise%20Resource%20Planning%20%7C%20Point%20of%20Sales%20%7C%20Production%20Workflow\&descAlignY=60)

# 🚀 SIMKEMAS

> **Enterprise Resource Planning (ERP)** & **Point of Sales (POS)** untuk **Pusat Layanan Kemasan UMKM**

```md

<p align="center">

![Build](https://img.shields.io/github/actions/workflow/status/viabdillah/simkemas/ci.yml?branch=main&style=for-the-badge&logo=githubactions&label=Build)
![Version](https://img.shields.io/github/v/release/viabdillah/simkemas?style=for-the-badge&label=Version)
![Release](https://img.shields.io/github/release-date/viabdillah/simkemas?style=for-the-badge&label=Release)
![Last Commit](https://img.shields.io/github/last-commit/viabdillah/simkemas?style=for-the-badge&label=Last%20Commit)
![Stars](https://img.shields.io/github/stars/viabdillah/simkemas?style=for-the-badge&logo=github)
![Forks](https://img.shields.io/github/forks/viabdillah/simkemas?style=for-the-badge&logo=github)
![Issues](https://img.shields.io/github/issues/viabdillah/simkemas?style=for-the-badge)
![License](https://img.shields.io/github/license/viabdillah/simkemas?style=for-the-badge)

</p>
```

---

## Tentang SIMKEMAS
## Preview
## Modul Utama
## Dashboard
## Keamanan
## Arsitektur Sistem
## Workflow Produksi
## Tech Stack
## Struktur Project
## Quick Start
## Roadmap
## Kontribusi
## Lisensi

---

## ✨ Tentang SIMKEMAS

SIMKEMAS merupakan platform **Enterprise Resource Planning (ERP)** dan **Point of Sales (POS)** yang dirancang khusus untuk **Pusat Layanan Kemasan UMKM**.

Platform ini mengintegrasikan seluruh proses bisnis dalam satu sistem, mulai dari **pemesanan pelanggan**, **workflow produksi lintas divisi**, **manajemen keuangan**, hingga **dashboard analitik** secara real-time.

### 🎯 Fitur Unggulan

* 🚀 ERP & POS dalam satu platform
* 🏭 Workflow Produksi Multi Divisi
* 📦 Manajemen Pesanan (SPK)
* 👥 Customer Management
* 💰 Manajemen Keuangan
* 📊 Dashboard Analitik Real-time
* 🔐 Role Based Access Control (RBAC)
* ☁️ Cloudflare Serverless Architecture

---

## 🖥️ Preview

> 🚧 Coming Soon.

---

## 📦 Modul Utama

### 🛒 Point of Sales (POS)

* Pembuatan SPK
* Data Pelanggan
* Data Produk Kemasan
* Pembayaran DP
* Pelunasan
* Cicilan
* Cetak Invoice
* Riwayat Transaksi

### 🎨 Workflow Produksi

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

#### 🎨 Divisi Desain

* Drag & Drop Workflow
* Approval Desain
* Upload File

#### 🖨️ Divisi Produksi

* Monitoring Produksi
* Validasi Material
* Status Mesin

#### 📦 Divisi Packaging

* Quality Control
* Packing
* Ready Pickup

---

## 📊 Dashboard

Dashboard menyediakan informasi bisnis secara real-time, meliputi:

* 📈 Omzet
* 📦 SPK Aktif
* 👥 Data Pelanggan
* 💰 Cashflow
* ⭐ Produk Terlaris
* 📄 Export CSV

---

## 🔒 Keamanan

| Fitur                            | Status |
| -------------------------------- | :----: |
| Role Based Access Control (RBAC) |    ✅   |
| Audit Log                        |    ✅   |
| Permission Management            |    ✅   |
| Secure Authentication            |    ✅   |

---

````md
## 🏗️ System Architecture

```mermaid
flowchart TB

%% ===== Client Layer =====
subgraph CLIENT["🖥️ Client Layer"]
    WEB["🌐 Web Application<br/>React 19 + Vite"]
end

%% ===== Edge Layer =====
subgraph EDGE["☁️ Cloudflare Edge"]
    API["⚡ Pages Functions"]
    AUTH["🔐 Authentication"]
    CACHE["⚡ KV Cache"]
end

%% ===== Data Layer =====
subgraph DATA["🗄️ Data Layer"]
    D1[("Cloudflare D1")]
    R2["📁 Cloudflare R2"]
end

%% ===== Shared Layer =====
subgraph SHARED["📦 Shared Package"]
    TYPES["Types"]
    UTILS["Utilities"]
end

%% ===== Flow =====
WEB --> API

API --> AUTH
API --> D1
API --> R2
API --> CACHE

API -. uses .-> TYPES
API -. uses .-> UTILS

WEB -. uses .-> TYPES
WEB -. uses .-> UTILS

%% ===== Style =====
style CLIENT fill:#E0F2FE,stroke:#0284C7
style EDGE fill:#FEF3C7,stroke:#F59E0B
style DATA fill:#DCFCE7,stroke:#16A34A
style SHARED fill:#F3E8FF,stroke:#8B5CF6
```
````


---

## 🔄 Workflow Produksi

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

## ⚙️ Tech Stack

| Layer          | Teknologi                  |
| -------------- | -------------------------- |
| Frontend       | React 19                   |
| Build Tool     | Vite 7                     |
| Styling        | Tailwind CSS v4            |
| Backend        | Cloudflare Pages Functions |
| Database       | Cloudflare D1              |
| Object Storage | Cloudflare R2              |
| Cache          | Cloudflare KV              |
| Icons          | Lucide React               |
| Drag & Drop    | Hello Pangea DnD           |
| Architecture   | Monorepo (npm Workspaces)  |

---

## 📁 Struktur Project

```text
📦 SIMKEMAS
│
├── 🌐 frontend
│   └── React 19 + Vite + Tailwind CSS
│
├── ⚡ backend
│   └── functions
│       ├── _lib
│       └── api
│
├── 🔗 shared
│   └── src
│
├── 📄 package.json
├── 📄 README.md
├── 📄 LICENSE
└── 📄 .gitignore
```

> **Catatan**
>
> Folder `backend` tidak termasuk dalam **npm workspace** karena tidak memiliki dependency Node.js. Seluruh fungsi dijalankan langsung menggunakan **Cloudflare Pages Functions** melalui `wrangler`.

---

## ✨ Features

### 🛒 Point of Sales

* Pembuatan SPK
* Manajemen Pelanggan
* Manajemen Produk Kemasan
* Pembayaran DP
* Pelunasan & Cicilan
* Cetak Invoice
* Riwayat Transaksi

### 🏭 Production Workflow

* Kanban Workflow
* Drag & Drop
* Assignment Antar Divisi
* Approval Desain
* Upload File Produksi
* Quality Control
* Status Produksi Real-time

### 💰 Finance

* Cashflow
* Pembayaran DP
* Pelunasan
* Riwayat Pembayaran
* Laporan Keuangan

### 📊 Dashboard & Analytics

* Dashboard Real-time
* Omzet
* Produk Terlaris
* SPK Aktif
* Statistik Pelanggan
* Export CSV

### 🔐 Security

* Role Based Access Control (RBAC)
* Permission Management
* JWT Authentication
* Audit Log
* Secure API

```

## 🔌 REST API

Seluruh endpoint menggunakan prefix:

```text id="xj62lr"
/api
```

### Authentication

| Method | Endpoint       | Deskripsi          |
| ------ | -------------- | ------------------ |
| POST   | `/auth/login`  | Login pengguna     |
| POST   | `/auth/logout` | Logout             |
| GET    | `/auth/me`     | Informasi pengguna |

### Customers

| Method | Endpoint         |
| ------ | ---------------- |
| GET    | `/customers`     |
| POST   | `/customers`     |
| PUT    | `/customers/:id` |
| DELETE | `/customers/:id` |

### Orders (SPK)

| Method | Endpoint      |
| ------ | ------------- |
| GET    | `/orders`     |
| POST   | `/orders`     |
| GET    | `/orders/:id` |
| PUT    | `/orders/:id` |

### Production

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/production`            |
| PUT    | `/production/:id/status` |

### Finance

| Method | Endpoint    |
| ------ | ----------- |
| GET    | `/payments` |
| POST   | `/payments` |
| GET    | `/cashflow` |

> Seluruh endpoint mengembalikan response dalam format JSON.

```

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)

```env id="56udul"
VITE_API_URL=http://localhost:8788
```

### Backend (`backend/.dev.vars`)

```env id="31dvj5"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

DB_NAME=simkemas

R2_BUCKET=simkemas-files

KV_NAMESPACE=simkemas-cache

```

> Jangan pernah meng-commit file `.env` maupun `.dev.vars` ke repository.
>
> Gunakan `.env.example` sebagai template konfigurasi untuk developer baru.

```

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)

```env id="56udul"
VITE_API_URL=http://localhost:8788
```

### Backend (`backend/.dev.vars`)

```env id="31dvj5"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

DB_NAME=simkemas

R2_BUCKET=simkemas-files

KV_NAMESPACE=simkemas-cache
```

> Jangan pernah meng-commit file `.env` maupun `.dev.vars` ke repository.
>
> Gunakan `.env.example` sebagai template konfigurasi untuk developer baru.
```
## 🚀 Deployment

### Frontend

Deploy menggunakan **Cloudflare Pages**.

```bash id="q5nvh0"
npm run build
```

Output build:

```text id="u3zzx8"
frontend/dist
```

---

### Backend

Deploy menggunakan **Wrangler**.

```bash id="fgd9o3"
cd backend
wrangler deploy
```

---

### Database

Membuat database Cloudflare D1:

```bash id="cwmys8"
wrangler d1 create simkemas
```

Migrasi database:

```bash id="c0n6wn"
wrangler d1 migrations apply simkemas
```

---

### Storage

Membuat bucket Cloudflare R2:

```bash id="3y5e6e"
wrangler r2 bucket create simkemas-files
```

---

### Cache

Membuat namespace KV:

```bash id="d3jrd5"
wrangler kv namespace create CACHE
```

---

### Production Architecture

```text id="dawpz9"
Browser
    │
    ▼
Cloudflare Pages
    │
    ▼
Pages Functions
    │
 ┌──┴───────────┐
 ▼              ▼
Cloudflare D1  Cloudflare R2
       │
       ▼
Cloudflare KV
```


## 📈 Roadmap

| Status | Modul                 |
| :----: | --------------------- |
|    ✅   | Point of Sales        |
|    ✅   | Workflow Produksi     |
|    ✅   | Dashboard             |
|    ✅   | Manajemen Keuangan    |
|    ✅   | Export CSV            |
|   🚧   | WhatsApp Notification |
|   🚧   | Dashboard Mobile      |
|   🚧   | QR Code               |
|   🚧   | Multi Cabang          |
|   🚧   | Cloud Backup          |
|   🚧   | AI Analytics          |

---

## 🤝 Kontribusi

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

## 📜 Lisensi

Project ini menggunakan **MIT License**.

---

## ⭐ SIMKEMAS

**ERP • POS • Workflow Produksi • Dashboard Analytics**

Dibangun menggunakan **React**, **Cloudflare Workers**, dan **Tailwind CSS**.

**© 2026 Divi Abdillah Almasrur**

![Footer](https://capsule-render.vercel.app/api?type=waving\&height=180\&color=0:0F172A,50:2563EB,100:14B8A6\&section=footer)
