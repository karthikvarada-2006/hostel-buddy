# Hostel Buddy 3 🏘️

An intelligent Hostel Management System designed for students and administrators to streamline daily operations with a powerful AI-driven voice interface.

## 🚀 Key Features
- **🎙️ AI Voice Command System**: Navigate and manage the entire app using natural speech (Gemini-powered intent detection).
- **🏘️ Multi-Hostel Support**: Manage different hostels with ease.
- **🚨 Real-time Complaints**: Students can file issues and admins can resolve them.
- **🎫 Digital Gate Passes**: Automated pass request and approval workflow.
- **🍱 Food Menu & Attendance**: Digital management of daily operations.

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini 1.5 Flash (via Supabase Edge Functions)
- **Voice**: Web Browser Speech API

## 📋 Installation & Setup

1. **Clone the Repo**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd hostel-buddy-main
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

4. **AI Voice Configuration (CRITICAL)**:
   This project uses a custom Supabase Edge Function `ai-intent-parser`.
   - Set your Gemini API key in Supabase Secrets:
     ```sh
     supabase secrets set GEMINI_API_KEY=your_google_ai_studio_key
     ```
   - Ensure the Edge Function is deployed or running locally.

5. **Run Locally**:
   ```sh
   # If you have PowerShell restrictions, use:
   powershell -ExecutionPolicy Bypass -Command "npm run dev"
   ```

## 🎙️ Sample AI Voice Commands
- *"Open my dashboard"*
- *"Show me the food menu"*
- *"Add a new student named Rahul"*
- *"Mark everyone as present"* (Admin)
- *"Delete the last notice"* (Admin)
- *"What can I say?"* (Help)

## 🏗️ Project Structure
- `/src/pages`: Main application screens (Complaints, Passes, Students, etc.)
- `/src/components/layout`: Global components like `VoiceNavigation`.
- `/supabase/functions`: Edge Functions for AI processing.

---
Built with ❤️ for a smarter hostel experience.
