# TransitOps – Smart Transport Operations Platform

TransitOps is a modern, enterprise-ready Transport Management System (TMS) designed for logistics companies to manage vehicles, drivers, trips, maintenance, expenses, and analytics. 

This repository contains the architecture blueprint and initial project setup, establishing a solid, production-ready foundation with pre-configured client and server environments.

---

## Tech Stack

### Frontend (Client)
- **React 19**: Modern components and hooks.
- **TypeScript**: Complete type safety.
- **Vite**: Rapid hot module replacement (HMR) and bundling.
- **Tailwind CSS**: Utility-first CSS styling.
- **shadcn/ui**: Modern, accessible UI components.
- **React Router DOM**: Declarative front-end routing.
- **Axios**: Promised-based HTTP client configuration.
- **TanStack Query (React Query)**: Caching, sync, and server-state management.
- **React Hook Form & Zod**: Schema-based form validation.
- **Lucide React**: Vector icons.
- **Sonner**: Toast notification manager.

### Backend (Server)
- **Node.js**: Event-driven runtime.
- **Express.js**: Fast, unopinionated web framework.
- **TypeScript**: Strongly-typed server environment.
- **MongoDB & Mongoose**: Flexible document-oriented database mapping.
- **dotenv**: Environment variable configuration.
- **cors**: Cross-Origin Resource Sharing middleware.
- **nodemon**: Dev-server auto-restart utility.

---

## Folder Structure

```
TransitOps/
├── README.md
├── .gitignore
├── .env.example
├── client/
│   ├── .env.example
│   ├── .gitignore
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── assets/
│       ├── components/
│       │   └── ui/          (Button, Card, loading etc.)
│       ├── layouts/         (AppLayout with Sidebar and Navbar)
│       ├── pages/           (All core view placeholders)
│       ├── hooks/           (Custom application hooks)
│       ├── services/        (Axios client configuration)
│       ├── context/         (ThemeProvider for Dark/Light mode)
│       ├── types/           (TypeScript definitions)
│       ├── utils/           (Common helpers)
│       ├── routes/          (App routes configuration)
│       └── lib/             (cn helper and styling configurations)
└── server/
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    ├── nodemon.json
    └── src/
        ├── index.ts
        ├── config/          (Mongoose DB configuration)
        ├── controllers/     (Request handlers)
        ├── middlewares/     (Error management & Route guards)
        ├── models/          (Mongoose data models)
        ├── routes/          (Express router definitions)
        ├── services/        (Business layer execution logic)
        ├── validators/      (Zod request payload schemas)
        └── utils/           (Utility scripts)
```

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally or MongoDB Atlas connection string)

### 1. Repository Setup
Clone the repository and copy the environment file placeholders:
```bash
# Clone the repository
git clone <repository-url>
cd Smart-Transport-Operations-Platform

# Copy env samples
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### 2. Backend Server Installation
Navigate into the `server` directory and install the dependencies:
```bash
cd server
npm install
```

### 3. Frontend Client Installation
Navigate into the `client` directory and install the dependencies:
```bash
cd ../client
npm install
```

---

## Running the Application

### Running the Backend Server
Run the Express backend in development mode (with Hot Reload via `nodemon`):
```bash
cd server
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000). You can check health via:
[http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### Running the Frontend Client
Run the Vite development server:
```bash
cd client
npm run dev
```
The client will start on [http://localhost:5173](http://localhost:5173).

---

## Architecture Guidelines

- **TypeScript Everywhere**: Keep strict type safety across both applications.
- **API Versioning**: All endpoints must be prefixed with `/api/v1/`.
- **Global Error Handling**: Ensure all server-side errors are caught by `errorMiddleware` to avoid server crashes.
- **Absolute Imports**: Frontend paths use absolute mapping prefixed with `@/` referencing `client/src/`.
