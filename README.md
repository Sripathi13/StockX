# StockVault - Enterprise Modular Inventory Management System (IMS)


> Enterprise-grade real-time inventory management platform inspired by **Zoho Inventory**, **Odoo Inventory**, **Linear**, and **Oracle NetSuite**. Designed to replace manual registers, spreadsheets, and fragmented logistics tools with strict role-based control, multi-warehouse bin allocation, automated receipt put-away, outbound order picking/packing/shipping, cycle count discrepancy audits, and an immutable stock ledger.

---

## 🌟 Key Features

### 1. Multi-Warehouse & Bin Hierarchy Architecture
- Multi-facility management (**Central Logistics Alpha Hub**, **Depot Beta**, etc.).
- Fine-grained rack coordinates (**Zone A**, **Rack A-01**, **Shelf A-01-03**, **Bin coordinates**).
- Real-time stock partitioning (`quantity_on_hand`, `quantity_reserved`, `quantity_available`).

### 2. Full Inbound Goods Receipt Lifecycle (Step 1)
- Supplier management, lead time ratings, and expected delivery scheduling.
- Sequential lifecycle: `DRAFT` ➔ `WAITING` ➔ `RECEIVED` ➔ `DONE`.
- Physical quantity verification with automatic dock receiving put-away tasks.

### 3. Outbound Order Fulfillment & Picking Workflow (Step 3)
- Multi-stage order dispatch: `DRAFT` ➔ `PICKING` ➔ `PACKED` ➔ `READY` ➔ `SHIPPED` ➔ `DONE`.
- Bin-routed pick list view showing exact physical coordinates with barcode scanning verification.
- Automatic inventory reservation upon approval and deduction upon carrier dispatch.

### 4. Internal Relocations & Multi-Item Transfers (Step 2)
- Multi-location stock transfer: `DRAFT` ➔ `WAITING` ➔ `IN_TRANSIT` ➔ `RECEIVED` ➔ `DONE`.
- Atomic dual-entry ledger logging (`TRANSFER_OUT` from source + `TRANSFER_IN` to destination).

### 5. Physical Stock Count & Reconciliation (Step 4)
- Compare physical count against system registered quantity.
- Compute variance differences with categorized reasons (`DAMAGE`, `LOSS`, `RECOUNT`, `CORRECTION`, `EXPIRED`).
- Manager approval workflow before committing balance updates.

### 6. Immutable Stock Movement Ledger & Audit Logs (Step 6)
- Complete append-only audit trail logging every stock delta, user signature, reason, and reference ID.
- Full system audit log tracking security logins, changes, and modifications with IP addresses and timestamps.

### 7. Executive Analytics Dashboard & Reporting (Step 5)
- Real-time KPIs: Total Products, Asset Valuation, Critical Reorder Alerts, Inbound Dock Queue, Outbound Dispatches.
- Printable, downloadable CSV & JSON exports for full compliance audits and Excel replacements.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons, Web Audio Engine.
- **Backend & Database Architecture**: Express.js, TypeScript, PostgreSQL Schema with Prisma ORM, JWT, bcrypt.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start Guide

### Running with Docker Compose
```bash
# Clone the repository
git clone https://github.com/stockvault/stockvault.git
cd stockvault

# Spin up PostgreSQL, Express API, and React Frontend
docker compose up --build
```

### Local Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Compile & typecheck
npm run build
npm run lint
```

The application runs on `http://localhost:3000`.

---

## 🔐 Role-Based Access Credentials

| Role | Name | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | Sarah Vance | `admin@stockvault.corp` | Complete control over users, settings, audit logs, warehouses, products, and approvals |
| **Inventory Manager** | Sarah Vance | `sarah.vance@stockvault.corp` | Product catalog, receipts validation, dispatch orders, adjustments approval, reports |
| **Warehouse Staff** | Marcus Chen | `marcus.chen@stockvault.corp` | Barcode scanning, floor picking queue, dock shelving put-away, cycle counts |

---

## 📄 License
Licensed under Apache-2.0. Built with production-ready standards for enterprise inventory control.
