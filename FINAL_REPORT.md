# HOSTEL BUDDY — An Intelligent Hostel Management System with AI-Powered Voice Interface

---

**A Project Report**
**Submitted in Partial Fulfillment of the Requirements for the Award of the Degree of**
**Bachelor of Technology**

**Department of Computer Science and Engineering**

---

**Project Title:** Hostel Buddy — Intelligent Hostel Management System

**Academic Year:** 2025–2026

---

## TABLE OF CONTENTS

| Chapter | Title | Page |
|---------|-------|------|
| 1 | Abstract | 3 |
| 2 | Introduction | 4 |
| 2.1 | Problem Statement | 4 |
| 2.2 | Objectives | 5 |
| 2.3 | Scope of the Project | 5 |
| 3 | Literature Survey | 6 |
| 3.1 | Existing Systems | 6 |
| 3.2 | Limitations of Existing Systems | 7 |
| 3.3 | Proposed System Advantages | 7 |
| 4 | System Analysis | 8 |
| 4.1 | Feasibility Study | 8 |
| 4.2 | System Requirements | 9 |
| 5 | Methodology | 10 |
| 5.1 | Software Development Life Cycle (SDLC) | 10 |
| 5.2 | Agile Methodology | 11 |
| 5.3 | System Architecture | 12 |
| 5.4 | Data Flow Diagrams | 13 |
| 5.5 | Entity-Relationship Diagram | 15 |
| 5.6 | Use Case Diagram | 17 |
| 6 | Implementation | 19 |
| 6.1 | Modules Description | 19 |
| 6.2 | Tools and Technologies Used | 26 |
| 6.3 | Implementation of Project | 29 |
| 7 | Testing | 42 |
| 8 | Results and Screenshots | 44 |
| 9 | Conclusion and Future Enhancements | 46 |
| 10 | References | 47 |

---

## CHAPTER 1: ABSTRACT

Hostel Buddy is a comprehensive, web-based Hostel Management System designed to digitize and streamline the day-to-day administrative operations of college hostels. The system replaces traditional manual processes — such as paper-based attendance registers, handwritten gate pass forms, verbal complaint reporting, and bulletin board notices — with an efficient, real-time digital platform accessible to both students and administrators.

The system is built using modern web technologies including **React.js** with **TypeScript** for a type-safe, component-driven frontend, **Supabase** (PostgreSQL) for the backend database and authentication, **Tailwind CSS** with **Shadcn UI** for a responsive user interface, and **Google Gemini 1.5 Flash AI** for an innovative voice command system. The voice interface leverages the Web Speech API for speech recognition and Supabase Edge Functions to process natural language commands through the Gemini AI model, enabling hands-free navigation and management of the entire application.

Key features include role-based authentication (Student and Admin portals), attendance tracking with calendar visualization, digital gate pass request and approval workflows, complaint management with image attachments and priority levels, weekly food menu management, notice board with archival capabilities, student directory management, real-time data synchronization via Supabase Realtime subscriptions, and a comprehensive AI-powered voice command system supporting 30+ distinct operations.

The project demonstrates the practical application of modern full-stack web development, cloud-based Backend-as-a-Service (BaaS) architecture, and artificial intelligence integration to solve real-world hostel management challenges.

**Keywords:** Hostel Management System, React.js, TypeScript, Supabase, AI Voice Commands, Google Gemini, Real-time Web Application, Role-Based Access Control

---

## CHAPTER 2: INTRODUCTION

### 2.1 Problem Statement

College hostel management in India continues to rely heavily on manual, paper-based processes that are inefficient, error-prone, and time-consuming. The key challenges faced by hostel administrators and students include:

1. **Manual Attendance Tracking:** Wardens maintain physical attendance registers, making it difficult to compute monthly attendance percentages or identify absentees quickly. Paper records are susceptible to damage, loss, and tampering.

2. **Paper-Based Gate Pass System:** Students must fill out physical forms for outing or vacation passes, which then need to be physically carried to the warden's office for approval. This process is slow, particularly during peak times such as weekends and holidays.

3. **Inefficient Complaint Resolution:** Students report maintenance issues or other complaints verbally or through complaint boxes. There is no way to track the status of a complaint, assign priority, or maintain a history of resolved issues.

4. **Outdated Communication Channels:** Notices are posted on physical bulletin boards, which students may not check regularly. Important announcements can be missed, and there is no archival system for past notices.

5. **Lack of Centralized Student Data:** Student information (room numbers, contact details, hostel blocks) is often maintained in Excel sheets or paper files, making it difficult for administrators to search, update, or generate reports.

6. **No Accessibility Features:** Existing manual systems provide no accessibility options for students with disabilities, and no hands-free operation mode for administrators managing multiple tasks simultaneously.

### 2.2 Objectives

The primary objectives of the Hostel Buddy project are:

1. To design and develop a web-based Hostel Management System that digitizes all core hostel operations.
2. To implement secure, role-based authentication with separate portals for students and administrators.
3. To create a real-time attendance management system with calendar-based visualization.
4. To build a digital gate pass request and approval workflow with complete lifecycle tracking.
5. To develop a complaint management module with image upload support, priority levels, and status tracking.
6. To implement a digital food menu management system with weekly scheduling.
7. To create a notice board with announcement posting, editing, archival, and deletion capabilities.
8. To integrate an AI-powered voice command system using Google Gemini for hands-free application control.
9. To ensure real-time data synchronization across all connected clients using WebSocket technology.
10. To provide a responsive, mobile-friendly interface accessible on any device.

### 2.3 Scope of the Project

The scope of Hostel Buddy encompasses the complete lifecycle of hostel management operations within a college setting. The system is designed for two primary user roles:

- **Students** can view their attendance records, request gate passes, submit and track complaints, view food menus, and read notices.
- **Administrators** can mark attendance, approve/reject gate passes, manage complaints with priority and resolution, update food menus, post notices, and manage the student directory.

The system also includes an AI-powered voice navigation system that allows both students and admins to perform all operations through natural speech commands, making it one of the first hostel management systems to integrate artificial intelligence for accessibility and convenience.

---

## CHAPTER 3: LITERATURE SURVEY

### 3.1 Existing Systems

Several hostel management systems exist in the market and academic domain:

| System | Features | Limitations |
|--------|----------|-------------|
| **Manual Paper-Based Systems** | Attendance registers, physical complaint boxes, paper gate passes | No digital records, difficult to search/filter, prone to loss |
| **Hostel Management Software (HMS) by commercial vendors** | Student registration, room allocation, fee management | Expensive licensing, no voice interface, desktop-only |
| **College ERP Systems (like JNTU ERP)** | Integrated with academics, centralized data | Over-complex for hostel-specific needs, slow UI, no real-time updates |
| **Custom PHP/MySQL Web Apps** | Basic CRUD operations, web-based | Outdated tech stack, poor mobile experience, no AI features |
| **Mobile-only hostel apps** | Mobile convenience, notifications | Limited admin functionality, no web dashboard, platform-dependent |

### 3.2 Limitations of Existing Systems

After reviewing existing literature and systems, the following key limitations were identified:

1. **No AI/Voice Integration:** None of the existing hostel management systems incorporate artificial intelligence or voice command capabilities for hands-free operation.
2. **Lack of Real-Time Updates:** Most existing systems require manual page refreshes to see updated data. There is no push-based notification or live data synchronization.
3. **Poor User Experience:** Many existing systems use outdated UI frameworks, resulting in clunky interfaces that are not mobile-responsive.
4. **No Image Support in Complaints:** Existing complaint systems are text-only, making it difficult for students to describe physical damage or maintenance issues visually.
5. **Monolithic Architecture:** Traditional systems use tightly coupled architectures, making it difficult to scale, maintain, or add new features independently.

### 3.3 Proposed System Advantages

Hostel Buddy addresses all the above limitations through:

- **AI-Powered Voice Commands** using Google Gemini 1.5 Flash for intelligent natural language understanding
- **Real-Time Data Sync** using Supabase Realtime (PostgreSQL Change Data Capture over WebSockets)
- **Modern, Responsive UI** built with React, Tailwind CSS, and Shadcn UI components
- **Image Attachments** in the complaint module using Supabase Storage with signed URLs
- **Microservices-Inspired Architecture** with Supabase Edge Functions (Deno runtime) for serverless AI processing
- **Component-Based Frontend** enabling independent development and testing of each module

---

## CHAPTER 4: SYSTEM ANALYSIS

### 4.1 Feasibility Study

#### 4.1.1 Technical Feasibility

The project is technically feasible as it uses well-established, production-ready technologies:
- **React.js 18** — Mature frontend library with a large ecosystem and community support
- **TypeScript 5** — Adds compile-time type safety, reducing runtime errors
- **Supabase** — Open-source Firebase alternative providing PostgreSQL database, authentication, real-time subscriptions, edge functions, and storage — all as managed services
- **Google Gemini API** — Production-grade AI model accessible via REST API
- **Web Speech API** — Built into modern browsers (Chrome, Edge) for speech recognition

#### 4.1.2 Operational Feasibility

The system is designed to be intuitive for both tech-savvy and non-technical users:
- Students can use the familiar web interface from any device
- Administrators benefit from the voice command system for rapid operations
- The role-based access control ensures users only see relevant features
- The real-time sync eliminates the need for manual refreshing

#### 4.1.3 Economic Feasibility

The project uses entirely free and open-source technologies:
- **Supabase Free Tier** — 500MB database, 1GB file storage, 50,000 monthly active users
- **Google Gemini API** — Free tier provides sufficient quota for development and moderate usage
- **Hosting** — Can be deployed on Vercel/Netlify free tier
- **Total Development Cost** — Zero licensing fees; only requires developer time

### 4.2 System Requirements

#### Hardware Requirements

| Component | Minimum Specification |
|-----------|----------------------|
| Processor | Intel Core i3 / AMD Ryzen 3 or higher |
| RAM | 4 GB (8 GB recommended) |
| Storage | 256 GB SSD |
| Network | Broadband internet connection |
| Display | 1366×768 resolution or higher |
| Microphone | Required for voice commands |

#### Software Requirements

| Component | Specification |
|-----------|--------------|
| Operating System | Windows 10/11, macOS, or Linux |
| Browser | Google Chrome 90+, Microsoft Edge 90+, Firefox 95+ |
| Node.js | v18.0.0 or higher |
| npm | v9.0.0 or higher |
| Code Editor | Visual Studio Code (recommended) |
| Version Control | Git 2.30+ |

---

## CHAPTER 5: METHODOLOGY

### 5.1 Software Development Life Cycle (SDLC)

The development of Hostel Buddy followed the **Agile Software Development Life Cycle** model, which emphasizes iterative development, continuous feedback, and adaptive planning. The SDLC phases were:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Planning &  │───▶│   System    │───▶│   Design &  │───▶│   Coding &  │───▶│  Testing &  │
│  Requirement │    │  Analysis   │    │Architecture │    │Implementation│   │ Deployment  │
│  Gathering   │    │             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                                                                           │
       └───────────────────── Feedback & Iteration Loop ◀──────────────────────────┘
```

**Phase 1 — Planning & Requirement Gathering:**
- Identified the pain points in manual hostel management through observation and discussions with hostel staff
- Documented functional and non-functional requirements
- Determined the technology stack based on modern web development best practices

**Phase 2 — System Analysis:**
- Analyzed existing systems and their limitations
- Performed feasibility studies (technical, operational, economic)
- Defined user roles, permissions, and data flow

**Phase 3 — Design & Architecture:**
- Designed the database schema with seven relational tables
- Created the component-based frontend architecture
- Designed the AI voice command processing pipeline
- Created wireframes and UI mockups for all screens

**Phase 4 — Coding & Implementation:**
- Set up the Vite + React + TypeScript development environment
- Implemented the Supabase backend (database tables, RLS policies, auth)
- Developed frontend modules iteratively (Auth → Dashboard → Attendance → Passes → Complaints → Menu → Notices → Students → Voice)
- Integrated the Gemini AI edge function for voice command processing

**Phase 5 — Testing & Deployment:**
- Performed unit testing using Vitest and React Testing Library
- Conducted integration testing for Supabase operations
- Tested voice commands across different browsers and accents
- Deployed the application for demonstration

### 5.2 Agile Methodology

The project adopted **Agile Scrum** principles with the following practices:

1. **Sprint-Based Development:** The entire project was divided into two-week sprints, each focusing on one or two major modules.
2. **Iterative Refinement:** Each module was developed, tested, and refined before moving to the next.
3. **Continuous Integration:** Code was regularly committed to Git, ensuring version control and traceability.
4. **User Story Driven:** Features were defined as user stories (e.g., "As a student, I want to submit a complaint with a photo so that the admin can visually understand the issue").

**Sprint Breakdown:**

| Sprint | Duration | Focus Area |
|--------|----------|------------|
| Sprint 1 | Weeks 1–2 | Project setup, Supabase configuration, Authentication (Student & Admin login/register) |
| Sprint 2 | Weeks 3–4 | Dashboard design, Attendance module (Student view + Admin marking) |
| Sprint 3 | Weeks 5–6 | Gate Pass module (Request, Approve, Reject, View workflows) |
| Sprint 4 | Weeks 7–8 | Complaints module (Submit, Edit, Delete, Image upload, Admin review) |
| Sprint 5 | Weeks 9–10 | Food Menu module, Notice Board module, Student Management |
| Sprint 6 | Weeks 11–12 | AI Voice Command System (Speech API + Gemini integration) |
| Sprint 7 | Weeks 13–14 | Real-time subscriptions, Testing, Bug fixes, Documentation |

### 5.3 System Architecture

Hostel Buddy follows a **three-tier client-server architecture** with a modern Backend-as-a-Service (BaaS) pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER (Frontend)                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  React.js  │  │ TypeScript│  │ Tailwind │  │  Shadcn UI       │  │
│  │ Components │  │  (Type    │  │   CSS    │  │  Component       │  │
│  │            │  │  Safety)  │  │          │  │  Library         │  │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        └───────────────┴─────────────┴─────────────────┘            │
│                              │                                      │
│              ┌───────────────┴───────────────┐                      │
│              │ React Router v6 (SPA Routing) │                      │
│              │ React Query (Data Caching)    │                      │
│              │ Context API (Auth State)      │                      │
│              └───────────────┬───────────────┘                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────┼──────────────────────────────────────┐
│                      APPLICATION TIER (Supabase)                    │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ Supabase Auth │  │ Supabase       │  │ Supabase Edge          │  │
│  │ (JWT-based    │  │ Realtime       │  │ Functions (Deno)       │  │
│  │  Authentication│ │ (WebSocket     │  │ ┌────────────────────┐ │  │
│  │  + RLS)       │  │  CDC)          │  │ │ ai-intent-parser   │ │  │
│  └───────┬───────┘  └───────┬────────┘  │ │ (Gemini 1.5 Flash) │ │  │
│          │                  │           │ └────────────────────┘ │  │
│          │                  │           │ ┌────────────────────┐ │  │
│          │                  │           │ │ create-student     │ │  │
│          │                  │           │ └────────────────────┘ │  │
│          │                  │           └────────────┬───────────┘  │
└──────────┼──────────────────┼────────────────────────┼──────────────┘
           │                  │                        │
┌──────────┼──────────────────┼────────────────────────┼──────────────┐
│          ▼                  ▼            DATA TIER   ▼              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 PostgreSQL Database                          │    │
│  │  Tables: profiles, attendance, complaints, passes,          │    │
│  │          food_menu, notices, notifications                   │    │
│  │  + Row Level Security (RLS) Policies                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Supabase Storage (S3-compatible)               │    │
│  │              Bucket: complaint-images                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.4 Data Flow Diagrams

#### 5.4.1 Context Level DFD (Level 0)

The context level DFD shows the system as a single process interacting with two external entities: Student and Admin.

```
                    ┌──────────┐
          Login,    │          │    View Attendance,
          Register, │ STUDENT  │    Complaints Status,
          Request   │          │    Pass Status,
          Pass,     └────┬─────┘    Menu, Notices
          File           │
          Complaint      │
                         ▼
                  ┌──────────────┐
                  │              │
                  │  HOSTEL      │
                  │  BUDDY       │
                  │  SYSTEM      │
                  │              │
                  └──────┬───────┘
                         │
                         ▲
          Login,    ┌────┴─────┐    Dashboard Stats,
          Mark      │          │    Student List,
          Attendance│  ADMIN   │    Complaint Details,
          Approve/  │          │    Pass Requests
          Reject    └──────────┘
          Passes,
          Manage
          Students
```

#### 5.4.2 Level 1 DFD

```
┌──────────┐                                              ┌──────────┐
│ STUDENT  │                                              │  ADMIN   │
└────┬─────┘                                              └────┬─────┘
     │                                                         │
     ▼                                                         ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1.0         │    │ 2.0         │    │ 3.0         │    │ 4.0         │
│ User Auth   │───▶│ Attendance  │    │ Complaint   │◀───│ Student     │
│ Module      │    │ Module      │    │ Module      │    │ Management  │
│             │    │             │    │             │    │ Module      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │profiles │      │attendance│      │complaints│      │ profiles │
   │  D1     │      │   D2     │      │   D3     │      │   D1     │
   └─────────┘      └──────────┘      └──────────┘      └──────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 5.0         │    │ 6.0         │    │ 7.0         │    │ 8.0         │
│ Pass        │    │ Food Menu   │    │ Notice      │    │ AI Voice    │
│ Module      │    │ Module      │    │ Module      │    │ Command     │
│             │    │             │    │             │    │ Module      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ passes  │      │food_menu │      │ notices  │      │ Gemini   │
   │  D4     │      │   D5     │      │   D6     │      │ AI API   │
   └─────────┘      └──────────┘      └──────────┘      └──────────┘
```

### 5.5 Entity-Relationship (ER) Diagram

The database consists of **seven main tables** with clearly defined relationships:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ENTITY-RELATIONSHIP DIAGRAM                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│       PROFILES           │
├──────────────────────────┤        ┌──────────────────────────┐
│ PK  id (UUID)            │        │       ATTENDANCE         │
│     user_id (UUID)       │        ├──────────────────────────┤
│     email (VARCHAR)      │───┐    │ PK  id (UUID)            │
│     full_name (VARCHAR)  │   │    │ FK  student_id → profiles│
│     role (ENUM)          │   ├───▶│ FK  marked_by → profiles │
│     room_number (VARCHAR)│   │    │     attendance_date (DATE)│
│     hostel_name (VARCHAR)│   │    │     is_present (BOOLEAN)  │
│     jntu_number (VARCHAR)│   │    │     created_at (TIMESTAMP)│
│     branch (VARCHAR)     │   │    └──────────────────────────┘
│     year (VARCHAR)       │   │
│     created_at (TIMESTAMP)│  │    ┌──────────────────────────┐
│     updated_at (TIMESTAMP)│  │    │       COMPLAINTS         │
└──────────────────────────┘   │    ├──────────────────────────┤
                               │    │ PK  id (UUID)            │
                               ├───▶│ FK  student_id → profiles│
                               │    │     title (VARCHAR)      │
                               │    │     description (TEXT)    │
                               │    │     status (ENUM)        │
                               │    │     priority (ENUM)      │
                               │    │     image_url (VARCHAR)  │
                               │    │     resolution_notes     │
                               │    │     is_edited (BOOLEAN)  │
                               │    └──────────────────────────┘
                               │
                               │    ┌──────────────────────────┐
                               │    │         PASSES           │
                               │    ├──────────────────────────┤
                               ├───▶│ PK  id (UUID)            │
                               │    │ FK  student_id → profiles│
                               │    │ FK  approved_by → profiles│
                               │    │     pass_type (ENUM)     │
                               │    │     reason (TEXT)        │
                               │    │     destination (VARCHAR)│
                               │    │     from_date (TIMESTAMP)│
                               │    │     to_date (TIMESTAMP)  │
                               │    │     status (ENUM)        │
                               │    │     admin_comment (TEXT) │
                               │    └──────────────────────────┘
                               │
                               │    ┌──────────────────────────┐
                               │    │       FOOD_MENU          │
                               │    ├──────────────────────────┤
                               ├───▶│ PK  id (UUID)            │
                               │    │ FK  created_by → profiles│
                               │    │     menu_date (DATE)     │
                               │    │     breakfast (TEXT)      │
                               │    │     lunch (TEXT)          │
                               │    │     dinner (TEXT)         │
                               │    └──────────────────────────┘
                               │
                               │    ┌──────────────────────────┐
                               │    │        NOTICES           │
                               │    ├──────────────────────────┤
                               ├───▶│ PK  id (UUID)            │
                               │    │ FK  created_by → profiles│
                               │    │     title (VARCHAR)      │
                               │    │     content (TEXT)        │
                               │    │     is_important (BOOL)  │
                               │    │     is_archived (BOOL)   │
                               │    └──────────────────────────┘
                               │
                               │    ┌──────────────────────────┐
                               │    │     NOTIFICATIONS        │
                               │    ├──────────────────────────┤
                               └───▶│ PK  id (UUID)            │
                                    │ FK  user_id → profiles   │
                                    │     title (VARCHAR)      │
                                    │     message (TEXT)        │
                                    │     type (VARCHAR)        │
                                    │     is_read (BOOLEAN)     │
                                    │     related_id (UUID)     │
                                    └──────────────────────────┘
```

**Enumerations Used in the Database:**

| Enum Name | Values | Purpose |
|-----------|--------|---------|
| `user_role` | `student`, `admin` | Differentiates user types for access control |
| `complaint_status` | `pending`, `in_progress`, `resolved` | Tracks complaint lifecycle |
| `complaint_priority` | `low`, `medium`, `high` | Allows admins to prioritize complaints |
| `pass_status` | `pending`, `approved`, `rejected` | Tracks gate pass approval workflow |
| `pass_type` | `outing`, `home_vacation` | Categorizes pass requests |

### 5.6 Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOSTEL BUDDY SYSTEM                               │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                    STUDENT USE CASES                             │      │
│    │                                                                 │      │
│    │  ○ Register / Login                                             │      │
│    │  ○ View Dashboard (Stats, Recent activity)                      │      │
│    │  ○ View Attendance Calendar & Percentage                        │      │
│    │  ○ Request Gate Pass (Outing / Home Vacation)                   │      │
│    │  ○ Edit / Delete Pending Pass                                   │      │
│    │  ○ View Pass Status (Pending / Approved / Rejected)             │      │
│    │  ○ Submit Complaint (with optional image)                       │      │
│    │  ○ Edit / Delete Pending Complaint                              │      │
│    │  ○ View Complaint Status                                        │      │
│    │  ○ View Food Menu (Today + Weekly)                              │      │
│    │  ○ View Notice Board                                            │      │
│    │  ○ Use Voice Commands for Navigation                            │      │
│    │  ○ View Profile                                                 │      │
│    │  ○ Logout                                                       │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                     ADMIN USE CASES                              │      │
│    │                                                                 │      │
│    │  ○ Register / Login                                             │      │
│    │  ○ View Admin Dashboard (Summary statistics)                    │      │
│    │  ○ Mark Attendance (Individual / Mark All / By Name)            │      │
│    │  ○ Submit Attendance Records                                    │      │
│    │  ○ Approve / Reject Gate Passes (with comment)                  │      │
│    │  ○ Manage Complaints (Update Status, Priority, Resolution)      │      │
│    │  ○ Delete Complaints                                            │      │
│    │  ○ Update Food Menu (Breakfast, Lunch, Dinner per day)          │      │
│    │  ○ Post / Edit / Archive / Delete Notices                       │      │
│    │  ○ Add / Edit / Delete Students                                 │      │
│    │  ○ Use Voice Commands for All Operations                        │      │
│    │  ○ Logout                                                       │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                     AI / SYSTEM USE CASES                        │      │
│    │                                                                 │      │
│    │  ○ Parse Voice Input via Web Speech API                         │      │
│    │  ○ Send Transcribed Text to Gemini AI Edge Function             │      │
│    │  ○ Convert Natural Language → Structured JSON Intent            │      │
│    │  ○ Execute Command (Navigate, CRUD, Status Update)              │      │
│    │  ○ Speak Response via Speech Synthesis API                      │      │
│    │  ○ Real-time Data Sync via WebSocket (Supabase Realtime)        │      │
│    └─────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

