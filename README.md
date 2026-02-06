# AI-Powered Personalized Learning Path Generator

## 1. Project Description

The **AI-Powered Personalized Learning Path Generator** is a web-based application designed to provide learners with customized learning journeys based on their skills, qualifications, and career aspirations.

In the context of India’s skill development ecosystem, learners often face difficulty identifying structured and goal-oriented learning paths aligned with industry needs and the National Skills Qualifications Framework (NSQF). This project addresses that challenge by offering personalized learning recommendations and progress tracking through an AI-driven system.

The application supports secure authentication, detailed user profiles, dynamic learning path generation, and continuous progress monitoring to help learners achieve their career goals effectively.

---

## 2. API Endpoints

### Authentication

- **POST /api/auth/register** – Student Registration  
- **POST /api/auth/login** – Student Login  

---

### User Profile

- **GET /api/users/me** – Get Logged-in User Profile  
- **PUT /api/users/me** – Update User Profile  
- **POST /api/users/me/skills** – Add Skill  
- **DELETE /api/users/me/skills/:skill** – Remove Skill  

---

### Learning Path

- **POST /api/learning-paths/generate** – Generate Personalized Learning Path  
- **GET /api/learning-paths** – List User Learning Paths  
- **GET /api/learning-paths/:id** – Get Learning Path Details  
- **POST /api/learning-paths/:id/progress** – Update Learning Progress  

> 🔒 All endpoints except authentication require user authorization.
