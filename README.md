# Project Therabot

**System Analysis and Design (CSCI-C308 | INFO-I450) 2025**

Therabot is a diagnostic interview training platform designed for psychology students. It simulates patient interactions using a branching dialogue system, allowing students to practice clinical skills, identify symptoms, and submit diagnoses in a risk-free environment.

---

## Project Structure

### Root Directory
*   **`docker-compose.yml`**: Orchestrates the Docker containers (Database, Backend, Frontend, phpMyAdmin).
*   **`.gitignore`**: Specifies files to be ignored by Git (node_modules, build artifacts).

### Backend (`/backend`)
*   **`src/index.ts`**: The entry point of the API server. Defines routes and initializes services.
*   **`src/data-source.ts`**: Configuration for the MySQL database connection.
*   **`src/entity/`**: Defines Database Models (Tables).
    *   *Examples: `TherapistEntity.ts`, `ScenarioEntity.ts`, `TherapySessionEntity.ts`.*
*   **`src/repository/`**: Handles direct database interactions (CRUD operations).
    *   *Examples: `ScenarioRepository.ts`, `TherapistRepository.ts`.*
*   **`src/service/`**: Contains business logic, separating the controller logic from the database.
    *   *Examples: `TherapistService.ts` (Auth), `TherapySessionService.ts` (Chat logic).*
*   **`src/middleware/`**: Express middleware functions.
    *   `authMiddleware.ts`: Handles JWT verification and Admin checks.
*   **`src/utils/`**: Utility classes.
    *   `AppError.ts`, `errorHandler.ts`: Standardized error handling.

### Frontend (`/frontend`)
*   **`src/main.ts`**: The entry point. Handles client-side routing and initialization.
*   **`src/pages/`**: Logic files for specific application pages.
    *   `ChatPage.ts`, `AdminPage.ts`, `LoginPage.ts`, etc.
*   **`src/pages/templates/`**: Raw HTML files loaded by the page logic files.
    *   `ChatPage.html`, `AdminPage.html`, etc.
*   **`src/utils/`**: Frontend helper functions.
    *   `auth.ts`: Manages JWT tokens in LocalStorage.
    *   `theme.ts`: Handles Dark/Light mode toggling.
*   **`vite.config.ts`**: Configuration for the Vite build tool.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
*   **Git** ([Download](https://git-scm.com/downloads))
*   **Docker** ([Download](https://www.docker.com/products/docker-desktop/))

---

## Installation Instructions

### Download the Project via Git

Open your terminal (Command Prompt, PowerShell, or Terminal) and run the following commands to download the source code:

```bash
# Clone the repository
git clone https://github.com/AndrewWHans/system-analysis-design-capstone.git

# Navigate into the project directory
cd system-analysis-design-capstone
```
---

## Docker Setup

This project is containerized using Docker, which sets up the Database (MySQL), Backend (Node/Express), and Frontend (Vite/React) automatically.

### How to Build and Run the Containers

Ensure Docker Desktop is running properly by opening it and seeing if there's any errors on the initial application window, then execute the following command in the project root (where `docker-compose.yml` is located), this may take a while depending on your computer's specs:

```bash
# Build images and start containers
docker-compose up --build
```

## Accessing the Application

Once the containers are running, you can access the system via your web browser:

*   **Frontend (User Interface):** [http://localhost:5173](http://localhost:5173)
*   **Backend API (Test if the API is working):** [http://localhost:3000](http://localhost:3000)
*   **Database (External Access):** [http://localhost:8080](http://localhost:8080)
    *   User: `root`
    *   Password: `root`
    *   Database: `therabot`

---

## Default Admin User Credentials

The application automatically creates an Admin account upon the first successful database connection. You can use these credentials to log in and access the Admin Dashboard:

*   **Username:** `admin`
*   **Password:** `admin`

*Note: You can create new standard user accounts via the "Sign Up" page on the frontend, the account above is just for administrators to be able to use the administrative backend without having to create an admin account every time the docker container is rebuilt.*

---

### Stopping the Application
To stop the containers, press `Ctrl+C` in the terminal where Docker is running, then run:

```bash
docker-compose down
```

---

### Cleaning the Database
If you need to wipe the database and start fresh (e.g., if schema changes or data is corrupted), run the following commands:

```bash
# 1. Stop containers and remove network
docker-compose down

# 2. Remove the persistent database volume
docker volume rm system-analysis-design-capstone_db_data

# 3. Prune unused volumes to free space
docker volume prune -f
```

---

### Common Issue(s)

1. If you're on a older Windows 10/11 computer that hasn't had a Windows update in a while, you may need to update the Windows Subsystem for Linux(WSL) so that Docker can work properly. To do this run the following command in a terminal:

```bash
# Update Windows Subsystem for Linux(WSL)
wsl --update
```