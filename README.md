# HRFlow — HR & Internal Communication Management Platform

HRFlow is a full-stack Human Resource and Internal Communication Management System built with **Next.js, TypeScript, Prisma ORM, and MongoDB**.

The platform provides role-based access control, employee management, department hierarchy management, attendance tracking, leave workflows, internal messaging, file attachments, and role-aware dashboards.

---

## 🌐 Live Deployment & Repository

* **Production:** https://hrflow-omega.vercel.app
* **Login:** https://hrflow-omega.vercel.app/login
* **GitHub:** https://github.com/sajusameer/hrflow

---

## 🔑 Demo Accounts

| Role           | Email              | Password      | Main Capabilities                                                                  |
| -------------- | ------------------ | ------------- | ---------------------------------------------------------------------------------- |
| **Admin**      | `admin@hrflow.com` | `admin123`    | Manage employees, departments, department hierarchy, and administrative operations |
| **HR Manager** | `sanan@gmail.com`  | `password123` | Workforce management, attendance review, leave management, and HR operations       |
| **Employee**   | `sajeda@gmail.com` | `saju1234`    | Attendance, leave applications, messaging, and personal workforce activities       |

> **Note:** Permissions are enforced on the server based on the authenticated user's role.

---

# 🛠 Technology Stack

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* Lucide React

### Backend

* Next.js App Router
* Route Handlers
* Prisma ORM
* MongoDB Atlas

### Authentication & Security

* JWT-based authentication
* `jose`
* `bcryptjs`
* HTTP-only cookies
* Role-based server authorization

### Deployment

* Vercel
* MongoDB Atlas
* GitHub

---

# ✨ Implemented Features

* [x] Authentication & Registration
* [x] Login / Logout
* [x] Password hashing
* [x] Role-based authorization
* [x] Protected API routes
* [x] Employee CRUD
* [x] Employee deactivation
* [x] Employee search & filtering
* [x] Department hierarchy
* [x] Department head assignment
* [x] Department cycle prevention
* [x] Attendance clock-in/out
* [x] Attendance history
* [x] Duplicate attendance prevention
* [x] Leave submission
* [x] Leave approval / rejection
* [x] Leave validation
* [x] Internal messaging
* [x] Private conversation access control
* [x] Department communication
* [x] File attachment validation
* [x] Protected attachment access
* [x] Role-aware dashboard
* [x] Loading states
* [x] Empty states
* [x] Production build verification
* [x] Vercel deployment

---

# 🔐 Authentication & Authorization

HRFlow supports three primary roles:

* **Admin**
* **HR Manager**
* **Employee**

Authentication includes:

* User registration
* Secure password hashing
* Login
* Logout
* Authenticated sessions
* Protected API routes
* Server-side role authorization

Sensitive operations are authorized on the server rather than relying only on frontend UI restrictions.

---

# 👥 Employee Management

The employee management module provides:

* Employee directory
* Employee creation
* Employee editing
* Employee deactivation
* Department assignment
* Position management
* Employment status
* Employee search
* Department filtering

### Soft Deactivation

Employees are not permanently deleted when they are deactivated.

Instead, the employee's active status is changed. This allows historical records such as attendance and leave information to remain associated with the employee.

---

# 🏢 Department Hierarchy

Departments use parent-child relationships to represent organizational structure.

Example:

```text
Engineering
├── Frontend Engineering
├── Backend Engineering
└── QA

People Operations
├── HR
└── Recruitment
```

The system supports:

* Department creation
* Department updates
* Parent-child relationships
* Department heads
* Department filtering
* Hierarchical organization

### Cycle Prevention

The system prevents circular department relationships.

For example, this structure is invalid:

```text
Engineering
    ↓
Frontend Engineering
    ↓
React Team
    ↓
Engineering
```

Before updating a department's parent, the server checks the relevant ancestor/descendant relationships.

If the selected parent would create a cycle, the operation is rejected.

This protects the integrity of the organizational hierarchy.

---

# 👤 Department Head Validation

When assigning a department head, the server validates the selected employee according to the application's eligibility rules.

This prevents invalid employee records from being assigned as department heads.

---

# 🕐 Attendance Management

The attendance system supports daily clock-in and clock-out operations.

Features include:

* Clock-in
* Clock-out
* Attendance history
* Duplicate check-in prevention
* Attendance status
* Present / Late classification

### Attendance State Validation

Attendance follows a controlled state flow:

```text
No Clock-in
     ↓
Clock-in
     ↓
Active Attendance
     ↓
Clock-out
     ↓
Completed Attendance
```

The system prevents invalid operations such as:

* Clocking out without an active clock-in
* Creating duplicate attendance records for the same day
* Reopening completed attendance when not permitted

---

# 📝 Leave Management

Employees can submit leave requests through the leave management system.

Workflow:

```text
Employee
   ↓
Submit Leave
   ↓
PENDING
   ↓
Admin / HR Manager
   ↓
APPROVED / REJECTED
```

Features include:

* Leave submission
* Start/end date validation
* Overlapping leave validation
* Pending leave requests
* Approval
* Rejection
* Review remarks
* Reviewer information
* Review timestamp

Only authorized roles can approve or reject leave requests.

---

# 💬 Internal Messaging

HRFlow provides an internal communication system using conversations, participants, messages, and file attachments.

Messaging supports:

* Employee-to-employee conversations
* Department-based communication
* Conversation participants
* Message history
* File attachments

### Private Conversations

Private conversations are accessible only to authorized participants.

### Department Communication

The system supports department-based communication while maintaining access control for conversations and messages.


---

# 📎 File Attachments

The messaging system supports file attachments.

Supported formats include:

* PDF
* DOCX
* PNG
* JPG
* JPEG

The application validates attachment information such as:

* File name
* MIME type
* File size
* Storage key

Attachment access is protected by authorization checks to prevent unauthorized users from accessing files by guessing identifiers or URLs.

---

# 📊 Dashboard

The dashboard provides role-aware workforce information.

Depending on the authenticated user's role, it can display information such as:

* Employee counts
* Attendance information
* Pending leave requests
* Workforce statistics

Dashboard information is retrieved from application data rather than being hard-coded.

---

# 🏗 Project Architecture

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── me/
│   │   │   └── register/
│   │   │
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── attendance/
│   │   ├── leave/
│   │   └── messages/
│   │
│   ├── dashboard/
│   ├── employees/
│   ├── departments/
│   ├── attendance/
│   ├── leave/
│   └── messages/
│
├── components/
│   ├── layout/
│   └── ui/
│
├── lib/
│   ├── auth/
│   ├── db/
│   └── permissions/
│
└── types/
```

The project separates:

* UI components
* API routes
* Authentication
* Database access
* Authorization
* Domain types

---

# 🗄 Database Design

HRFlow uses **Prisma ORM with MongoDB**.

The main entities represent users, departments, attendance, leave requests, conversations, messages, and attachments.

Conceptually:

```text
User
 ├── Attendance
 ├── LeaveRequest
 ├── Message
 └── Participant

Department
 ├── Parent Department
 ├── Child Departments
 └── Department Head

Conversation
 ├── Participants
 ├── Messages
 └── Attachments
```

These relationships allow historical HR information to remain connected to employees and departments.

---

# 🔒 Security Considerations

## Password Security

Passwords are hashed using `bcryptjs` before being stored.

Plain-text passwords are not stored in the database.

## Authentication

Authenticated sessions use signed JWTs stored in HTTP-only cookies.

## Server Authorization

Sensitive operations are checked on the server.

General request flow:

```text
Client Request
      ↓
Authentication
      ↓
Identify User
      ↓
Role / Permission Check
      ↓
Request Validation
      ↓
Database Operation
```

This prevents users from bypassing frontend restrictions by directly calling protected APIs.

---

# 📈 Scalability Considerations

For a significantly larger workforce, the following improvements could be introduced.

### Employee Directory

Use cursor-based pagination instead of loading large datasets at once.

### Attendance Analytics

Move expensive reporting and aggregation to background jobs or precomputed reporting structures.

### Real-time Messaging

For high-volume real-time communication, a WebSocket architecture such as Socket.IO or a managed real-time service could be introduced.

### File Storage

Large attachments can be moved to object storage such as Amazon S3 or Cloudflare R2 with pre-signed upload/download URLs.

---

# ⚖️ Architectural Trade-offs

## JWT Authentication

### Advantages

* Lightweight authentication checks
* No session database lookup required for every request
* Suitable for a stateless application architecture

### Trade-off

Stateless tokens are not automatically invalidated before expiration.

For systems requiring immediate session revocation, a database-backed session system or token revocation mechanism could be introduced.

---

# 🚀 Local Development

## 1. Clone the Repository

```bash
git clone https://github.com/sajusameer/hrflow.git
cd hrflow
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/hrflow"
AUTH_SECRET="your-secure-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Sync Database

```bash
npx prisma db push
```

## 6. Seed Demo Data

```bash
npm run seed
```

## 7. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Production Build Verification

The production build was successfully verified using:

```bash
npm run build
```

The build completed successfully with:

```text
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

To run the production build locally:

```bash
npm start
```

---

# 📦 API Routes

### Authentication

* `POST /api/auth/register` — Register a new user
* `POST /api/auth/login` — Login and create authenticated session
* `POST /api/auth/logout` — Logout and clear the session
* `GET /api/auth/me` — Get the current authenticated user

### Employees

* `GET /api/employees` — List employees with search/filter support
* `POST /api/employees` — Create an employee
* `GET /api/employees/[id]` — Get employee details
* `PATCH /api/employees/[id]` — Update an employee
* `DELETE /api/employees/[id]` — Deactivate an employee

### Departments

* `GET /api/departments` — List departments
* `POST /api/departments` — Create a department
* `GET /api/departments/[id]` — Get department details
* `PATCH /api/departments/[id]` — Update a department

### Attendance

* `GET /api/attendance` — Get attendance records
* `GET /api/attendance/summary` — Get attendance summary

### Leave Management

* `GET /api/leave` — Get leave requests
* `POST /api/leave` — Submit a leave request
* `PATCH /api/leave/[id]/review` — Approve or reject a leave request

### Conversations & Messaging

* `GET /api/conversations` — Get accessible conversations
* `POST /api/conversations` — Create a conversation
* `GET /api/conversations/[id]/messages` — Get messages from a conversation
* `POST /api/conversations/[id]/messages` — Send a message

### Dashboard

* `GET /api/dashboard/stats` — Get role-aware dashboard statistics

### File Uploads

* `POST /api/upload` — Upload and validate file attachments

Protected endpoints perform authentication and appropriate role/permission checks where required.


# 🌍 Deployment

The application is deployed using **Vercel**.

Production application:

https://hrflow-omega.vercel.app

The project uses MongoDB Atlas for persistent database storage.

---

# 📄 Assessment Submission

**Candidate:** Sajeda Begum

**Project:** HRFlow — HR & Internal Communication Management Platform

**Assessment:** BRTGC Engineering Assessment

**GitHub Repository:**
https://github.com/sajusameer/hrflow

**Live Application:**
https://hrflow-omega.vercel.app

---

# 🎯 Project Objective

The primary objective of HRFlow is to demonstrate the design and implementation of a full-stack HR management platform with clear separation between frontend presentation, backend business logic, database operations, authentication, and server-side authorization.

The project focuses on more than basic CRUD operations by incorporating:

* Role-based access control
* Validation
* Organizational hierarchy
* Workflow state management
* Data preservation
* Private communication boundaries
* Attachment access control
* Production build verification

This project demonstrates practical full-stack development using the **Next.js App Router, TypeScript, Prisma, MongoDB, and server-side API authorization**.
