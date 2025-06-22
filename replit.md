# Chat Application - Real-time Public Chat

## Overview

This is a full-stack real-time chat application built with React (frontend), Express.js (backend), WebSockets for real-time communication, and PostgreSQL with Drizzle ORM for data persistence. The application supports user authentication, real-time messaging, online user tracking, and typing indicators.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket client for bidirectional communication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket server for instant messaging and user presence
- **Authentication**: JWT-based authentication with bcryptjs for password hashing
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: In-memory session handling for WebSocket connections

## Key Components

### Database Schema (shared/schema.ts)
- **Users Table**: Stores user credentials, online status, and metadata
- **Messages Table**: Stores chat messages with user relationships
- **Relations**: One-to-many relationship between users and messages
- **Validation**: Zod schemas for runtime type validation

### Authentication System
- **Registration/Login**: JWT token-based authentication
- **Password Security**: bcryptjs hashing with salt rounds
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Token validation for WebSocket connections

### Real-time Communication
- **WebSocket Server**: Handles real-time events (messages, typing, user presence)
- **Connection Management**: Tracks active user connections
- **Event Types**: Message broadcast, typing indicators, user online/offline status
- **Error Handling**: Reconnection logic and connection state management

### UI Components
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Component Library**: shadcn/ui for consistent design system
- **Form Management**: React Hook Form with Zod validation
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

1. **User Authentication**: Users register/login through forms → JWT token stored in localStorage
2. **WebSocket Connection**: Authenticated users establish WebSocket connection with token
3. **Message Flow**: User input → validation → WebSocket → database → broadcast to all connected users
4. **Real-time Updates**: Online users, typing indicators, and new messages propagated instantly
5. **Persistence**: All messages stored in PostgreSQL for message history

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection with Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **bcryptjs**: Password hashing for security
- **jsonwebtoken**: JWT token generation and validation
- **ws**: WebSocket implementation for real-time communication

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production server code
- **vite**: Frontend build tool and development server
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **JWT_SECRET**: Secret key for JWT token signing
- **NODE_ENV**: Environment mode (development/production)

### Replit Deployment
- **Auto-scaling**: Configured for autoscale deployment target
- **Port Configuration**: Server runs on port 5000, exposed on port 80
- **Module Support**: Uses nodejs-20, web, and postgresql-16 modules

## Changelog
- June 22, 2025: Sistema de chat público implementado com sucesso
  - Autenticação JWT funcionando
  - WebSocket para chat em tempo real
  - Interface responsiva completa
  - Sistema anti-spam avançado (10 msgs/5s, bloqueio 5s, anti-repetição 3x, máx 500 chars)
  - Indicador de digitação integrado na lista de usuários online
  - Pronto para teste com múltiplos usuários

## User Preferences

Preferred communication style: Simple, everyday language.