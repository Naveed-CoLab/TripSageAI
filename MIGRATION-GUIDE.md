# Project Restructuring for Vercel Deployment

This guide provides instructions for transitioning from the current monolithic structure to the new modular architecture optimized for Vercel deployment.

## Overview of Changes

The project has been reorganized into four main components:

1. `frontend/` - User-facing React application
2. `backend/` - Express server with API endpoints
3. `admin/` - Admin panel React application
4. `shared/` - Common code shared between components

## Migration Steps

### 1. Apply New Configuration Files

Replace the following files with their ".new" versions:

```bash
mv package.json.new package.json
mv .replit.new .replit
mv drizzle.config.ts.new drizzle.config.ts
mv README.md.new README.md
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Shared Package

```bash
cd shared && npm run build
```

### 4. Start Development Servers

```bash
npm run dev
```

## File Structure Overview

```
.
├── frontend/             # User-facing React application
│   ├── public/           # Static assets
│   ├── src/              # React components and logic
│   ├── index.html        # HTML entry point
│   ├── package.json      # Frontend dependencies
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── tsconfig.json     # TypeScript configuration
│   └── vite.config.ts    # Vite configuration
│
├── backend/              # Express API server
│   ├── src/              # Server code
│   │   ├── index.ts      # Server entry point
│   │   ├── routes.ts     # API routes
│   │   ├── db.ts         # Database connection
│   │   ├── auth.ts       # Authentication logic
│   │   └── storage.ts    # Data access layer
│   ├── package.json      # Backend dependencies
│   └── tsconfig.json     # TypeScript configuration
│
├── admin/                # Admin panel React application
│   ├── src/              # Admin components and logic
│   ├── index.html        # HTML entry point
│   ├── package.json      # Admin dependencies
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── tsconfig.json     # TypeScript configuration
│   └── vite.config.ts    # Vite configuration
│
├── shared/               # Shared code between all components
│   ├── src/              # Shared TypeScript code
│   │   ├── schema.ts     # Database schema definitions
│   │   └── index.ts      # Exports
│   ├── package.json      # Shared dependencies
│   └── tsconfig.json     # TypeScript configuration
│
├── migrations/           # Database migrations
├── vercel.json           # Vercel deployment configuration
├── package.json          # Root package.json with workspaces
├── drizzle.config.ts     # Drizzle ORM configuration
└── README.md             # Project documentation
```

## Vercel Deployment

After migrating to the new structure, you can deploy to Vercel by connecting your GitHub repository. Vercel will automatically recognize the configuration in `vercel.json`.

## Troubleshooting

If you encounter any issues during migration:

1. Check import paths in your code - they may need to be updated to reference the new structure
2. Ensure all dependencies are installed in the respective package.json files
3. Verify that environment variables are properly set in Vercel
4. Make sure the database connection is working correctly