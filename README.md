# Family Tree MVP

A full-stack Family Tree application built with Spring Boot and React.

## Features
- User Authentication (JWT)
- Multiple Family Trees per user
- Drag-and-drop tree visualization with `react-flow`
- Person profiles with photos, bios, and relationships
- Search functionality across all your trees
- Responsive design with Tailwind CSS

## Prerequisites
- Java 17 or higher
- Node.js 20 or higher
- PostgreSQL 15 or higher (or use H2 for testing)
- Maven

## Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create an `application.yml` (template in `src/main/resources/application.yml`).
3. Set your environment variables:
   ```bash
   export DB_URL=jdbc:postgresql://localhost:5432/familytree
   export DB_USER=your_user
   export DB_PASSWORD=your_password
   export JWT_SECRET=your_secret_at_least_256_bits
   ```
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`.

## Testing
To run the backend tests:
```bash
cd backend
mvn test
```

## Sample Data
On the first run, a sample user `john@example.com` with password `password` will be created with a 3-generation family tree.
