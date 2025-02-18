# TaskHive Backend 🛠️✨

The **TaskHive Backend** powers the TaskHive platform, enabling users to manage tasks, process payments, and handle user authentication. Built using Node.js and Express.js, it features JWT-based authentication and MongoDB for secure, scalable data storage. The backend supports a multi-role environment (Worker, Buyer, Admin) with dynamic task management capabilities.

---

## 🌐 Live Site URL

Check out the backend live site: [TaskHive Backend](#) *(https://task-hive-server-nine.vercel.app/)*

---

## 📌 Features

- **User Authentication**:
  - Secure user signup and login using JWT (JSON Web Token).
  - Token-based authentication for private routes and role-based access control.
  
- **Task Management**:
  - Buyers can create, view, and manage tasks.
  - Workers can submit completed tasks and track task status.
  - Admins can oversee tasks, users, and manage platform integrity.

- **Payment System**:
  - Integration for managing coin purchases, task payouts, and withdrawals for Workers.
  
- **Role-Based Access Control**:
  - Three distinct roles with tailored functionality: Worker, Buyer, Admin.

- **Notifications**:
  - Real-time updates for Workers on task status, payments, and withdrawals.

- **Comprehensive Error Handling**:
  - Structured error responses for smooth and consistent API operations.

---

## 🎯 Mission

The **TaskHive Backend** is designed to provide a secure, reliable, and scalable API that supports the TaskHive platform. It enables seamless user interactions, task management, and ensures smooth operations for Workers, Buyers, and Admins. Our goal is to make task completion and management efficient, while providing a rewarding experience for all users.

---

## 💡 Why Choose TaskHive Backend?

- **Secure Authentication**: JWT ensures secure user sessions and role-specific access control.
- **Task Management Flexibility**: Buyers can create tasks, and Workers can track and submit tasks.
- **Scalable Architecture**: Built to handle increasing users, tasks, and payments.
- **Optimized for Real-Time Performance**: Notifications and task updates are delivered in real-time for a responsive experience.
- **Error-Resilient**: Handles errors efficiently with clear responses to ensure smooth API operations.

---

## ⚙️ Technologies Used

### **Backend**

- **Framework**: Node.js with Express.js
- **Authentication**: JWT (JSON Web Token)
- **Database**: MongoDB (with Mongoose for object modeling)
- **Hosting**: Vercel / Custom Server (depending on deployment)

### **Libraries and Tools**

- **bcryptjs**: For secure password hashing.
- **dotenv**: For managing environment variables.
- **cors**: For Cross-Origin Resource Sharing support.
- **express-validator**: For request validation.
- **socket.io**: For real-time notifications (optional).
- **Stripe / Custom Payment System**: For handling Worker payments and coin purchases.
- **jsonwebtoken**: For creating and verifying JSON Web Tokens.

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/en/) 
- [MongoDB](https://www.mongodb.com/) 
