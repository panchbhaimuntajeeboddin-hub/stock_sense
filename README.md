# StockSense - Enterprise Modular Inventory Management System (IMS)

StockSense is a production-quality Inventory Management System built to digitize and streamline stock-related operations within a business, replacing manual registers and scattered spreadsheets with a centralized, real-time platform.

---

## 🏗️ System Architecture

```text
StockSense/
├── client/          # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/  # Axios API Client configuration
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/          # Node.js + Express.js Backend REST API
│   ├── prisma/
│   │   └── schema.prisma  # PostgreSQL Prisma ORM Schema
│   ├── src/
│   │   ├── config/        # Database connection setup
│   │   ├── controllers/   # REST API Route controllers
│   │   ├── middleware/    # Auth & Error handling middlewares
│   │   ├── routes/        # Router declarations
│   │   └── index.js       # Express server entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack & Key Technologies

### Frontend (`/client`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router (`react-router-dom`)
- **HTTP Client**: Axios
- **Analytics & Charts**: Recharts
- **Iconography**: Lucide React

### Backend (`/server`)
- **Runtime & Framework**: Node.js + Express.js
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Security & Auth**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Utility**: CORS, dotenv, nodemon

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js (`>= 18.0.0`)
- npm (`>= 9.0.0`)
- PostgreSQL database instance

---

### 1️⃣ Setting Up the Backend Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Update DATABASE_URL in .env to point to your PostgreSQL instance

# Generate Prisma Client
npm run prisma:generate

# Start the Backend Server (Runs on http://localhost:5000)
npm run dev
```

---

### 2️⃣ Setting Up the Frontend Client

```bash
# Open a new terminal and navigate to the client directory
cd client

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the Frontend Development Server (Runs on http://localhost:5173)
npm run dev
```

---

## 🔍 Independent Running & Verification

Both frontend and backend applications are decoupled and can run independently:

- **Backend Server API**: `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)
- **Frontend App UI**: `http://localhost:5173`

---

## 📋 License

This project is licensed under the ISC License.
