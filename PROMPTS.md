# AI Development Prompt Log

This file documents the AI assistance used during the development of the Car Dealership Inventory System.

AI tools were used as development assistants for implementation, debugging, testing, UI improvements, documentation, and deployment guidance.

The generated suggestions were reviewed and tested before being incorporated into the project.

---

## AI Tool 1: Lovable

### Prompt 1 – Initial Project Development

Build a full-stack car dealership inventory management system with a React frontend and FastAPI backend.

The system should support customer registration and login, administrator login, vehicle inventory management, vehicle search, purchasing, restocking, and role-based access control.

Include a clean and professional dealership-style user interface.

---

### Prompt 2 – Authentication

Implement user registration and login for the car dealership inventory system.

Users should have roles such as customer and admin. Customers should be able to browse and purchase vehicles, while administrators should be able to manage the inventory.

---

### Prompt 3 – Vehicle Inventory

Implement vehicle inventory functionality including:

- Add vehicle
- Get all vehicles
- Search vehicles
- Update vehicle
- Delete vehicle
- Purchase vehicle
- Restock vehicle

Ensure that inventory quantities are updated correctly after purchases and restocking.

---

### Prompt 4 – Admin Dashboard

Create an administrator dashboard for the dealership.

The dashboard should display:

- Number of vehicle models
- Units in stock
- Inventory value
- Units sold
- Low-stock warnings

Provide actions for adding, editing, deleting, and restocking vehicles.

---

### Prompt 5 – Vehicle Images

Improve the vehicle inventory interface by adding different vehicle images.

Provide multiple image options for different vehicle types such as:

- Sedan
- SUV
- Truck
- Electric
- Convertible
- Coupe
- Off-road

Ensure that vehicles do not unnecessarily display the same image.

---

### Prompt 6 – UI Improvements

Improve the dealership interface with a professional and responsive design.

Include:

- Vehicle cards
- Search and filtering
- Stock status badges
- Purchase buttons
- Admin dashboard
- Login and registration pages
- Vehicle editing forms
- Restock dialog

---

## AI Tool 2: ChatGPT

### Prompt 7 – Backend Debugging

Help debug the FastAPI backend and Pytest test suite.

The registration test was returning HTTP 400 instead of the expected HTTP 201 response. Identify the cause and provide a solution without breaking the existing authentication and vehicle functionality.

---

### Prompt 8 – Automated Testing

Help create and debug Pytest tests for the car dealership inventory API.

Test:

- User registration
- User login
- Add vehicle
- Get all vehicles
- Search vehicles
- Update vehicle
- Delete vehicle
- Purchase vehicle
- Restock vehicle
- Customer authorization restrictions

---

### Prompt 9 – Duplicate Vehicle Images

The application contains only a small set of unique vehicle images, but the inventory contains repeated vehicle records.

Explain how to prevent the same vehicle records and images from being unnecessarily repeated while keeping the existing inventory functionality.

---

### Prompt 10 – GitHub Repository

Help organize and prepare the car dealership inventory project for GitHub.

The repository should contain the backend, frontend, README documentation, test report, and AI development prompt documentation while avoiding unnecessary generated files such as Python cache files and virtual-environment files.

---

### Prompt 11 – README Documentation

Create a professional README for the Car Dealership Inventory System including:

- Project overview
- Key features
- Technology stack
- System architecture
- Project structure
- API endpoints
- Authentication and authorization
- Database
- Local setup instructions
- Testing
- Application flow
- AI-assisted development
- Future improvements
- Conclusion

---

### Prompt 12 – Deployment Guidance

Provide step-by-step guidance for deploying the car dealership inventory system using the GitHub repository.

The project contains a React frontend and FastAPI backend. Explain how to prepare the repository and deploy the application without relying on Lovable deployment.

---

## AI Usage Summary

AI assistance was mainly used for:

1. Project scaffolding and implementation
2. Frontend UI development
3. Backend API development
4. Authentication and authorization
5. Debugging
6. Automated testing
7. Vehicle inventory functionality
8. Documentation
9. Git and GitHub guidance
10. Deployment guidance

AI-generated code and suggestions were reviewed, modified where necessary, and tested locally before being used in the project.

---

## Human Verification

The final implementation was verified through:

- Local frontend execution
- Local FastAPI execution
- Swagger API testing
- Authentication testing
- Vehicle CRUD testing
- Purchase and restock testing
- Role-based authorization testing
- Automated Pytest execution

Final backend test result:

**11/11 tests passed**
