# MovieBooking - Cinema Booking System

A modern, full-stack cinema booking application built with React, Node.js, and MySQL. This system allows users to browse movies, select seats, make bookings, and provides administrators with comprehensive management tools.

## Live Demo

**Application**: [https://your-app-domain.com](https://your-app-domain.com) *(Live link will be updated soon)*


### API Documentation
![API Documentation](./docs/screenshots/api-docs.png)
*Complete API documentation with interactive examples*

**The full API documentation is available at `/api-docs` after starting the server:**

[View API Docs](http://localhost:3000/api-docs)

> **Note:** Make sure your server is running locally at `http://localhost:3000`. 

## 🛠️ Tech Stack

### Frontend
- **React**
- **Vite**
- **Tailwind CSS** 
- **React Router DOM** 
- **Zustand** 


### Backend
- **Node.js**
- **Express.js** 
- **Prisma ORM** 
- **MySQL** 
- **JWT**
- **bcryptjs** 
- **Socket.io**
- **CORS**


## Project Structure

```
scaler-assignment/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── admin/           # Admin panel components
│   │   ├── api/             # API service functions
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # WebSocket and other services
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Main server file
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   └── package.json
├── docs/                    # Documentation and screenshots
│   └── screenshots/
└── README.md
```

## Database Schema

The application uses MySQL with Prisma ORM. The database consists of the following main entities:

![Database Schema Diagram](./docs/db-schema-diagram.png)
*Complete database schema showing relationships between entities*

**Database Schema**: [View Interactive Schema](https://dbdiagram.io/d/movieBooking-68d199ca7c85fb9961db1ed0)

### Core Entities

- **Users** - User authentication and profiles
- **Movies** - Movie information and metadata
- **Cinemas** - Cinema locations and details  
- **Screens** - Individual screens within cinemas
- **Shows** - Movie showtimes and scheduling
- **Seats** - Seat layout and availability
- **Bookings** - User reservations and payments

### Key Relationships

- Users can have multiple Bookings
- Movies are shown in multiple Shows
- Cinemas contain multiple Screens
- Shows belong to one Screen and one Movie
- Bookings contain multiple Seats
- Seats belong to one Screen

## Local Development Setup

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **MySQL** 

### Step 1: Clone the Repository

```bash
git clone https://github.com/Dev07-Harsh/scaler-assignment.git
cd scaler-assignment
```

### Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://user:password@localhost:3306/movie_booking_db"
   
   # JWT Configuration
   JWT_SECRET="your-super-secure-jwt-secret-key-here"
   JWT_EXPIRES_IN="7d"
   
   # Server Configuration
   PORT=3000
   
   ```

5. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```

6. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```


7. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The backend API will be available at `http://localhost:3000`

### Step 3: Frontend Setup

1. **Open a new terminal** and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend application will be available at `http://localhost:5173`

### Step 5: Verify Installation

1. **Open your browser** and go to `http://localhost:5173`


## Key Features

### User Features
- **Movie Browsing** - Browse available movies with posters and details
- **Cinema Selection** - Choose from available cinemas and showtimes
- **Interactive Seat Selection** - Real-time seat availability with visual seat map
- **Secure Booking** - JWT-based authentication and secure payment processing
- **Booking History** - View and manage past bookings
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### Admin Features
- **Dashboard Analytics** - Overview of bookings, revenue, and system metrics
- **Movie Management** - Add, edit, and delete movies with poster uploads
- **Cinema Management** - Manage cinema locations and screen configurations
- **Show Scheduling** - Create and manage movie showtimes
- **Booking Oversight** - View and manage all user bookings
- **Real-time Updates** - Live booking status and seat availability


## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

- **Registration** - Users can create new accounts
- **Login** - Email and password authentication
- **Role-based Access** - Different permissions for users and admin
- **Protected Routes** - Frontend and backend route protection



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

**Built by [Dev07-Harsh](https://github.com/Dev07-Harsh)**

*Last updated: September 2025*