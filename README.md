# Project Therabot

**System Analysis and Design (CSCI-C308 | INFO-I450) 2025**

Therabot is a diagnostic interview training platform designed for psychology students. It simulates patient interactions using a branching dialogue system, allowing students to practice clinical skills, identify symptoms, and submit diagnoses in a risk-free environment.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
*   **Git** ([Download](https://git-scm.com/downloads))
*   **Docker** ([Download](https://www.docker.com/products/docker-desktop/))

---

## Installation Instructions

### 1. Download the Project via Git

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

Ensure Docker Desktop is running, then execute the following command in the project root (where `docker-compose.yml` is located):

```bash
# Build images and start containers
docker-compose up --build
```

## Accessing the Application

Once the containers are running, you can access the system via your web browser:

*   **Frontend (User Interface):** [http://localhost:5173](http://localhost:5173)
*   **Backend API (Test if the API is working):** [http://localhost:3000](http://localhost:3000)
*   **Database (External Access):** `localhost:8080`
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