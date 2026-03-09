# CSD Quiz Portal 🎓

A comprehensive Quiz and Study Material management platform built for the Department of Computer Science & Design, Sharnbasva University. This application allows faculty to create and manage quizzes, share study materials, and enables students to take assessments and earn downloadable certificates.

## 🚀 Features

- **Role-Based Access Control**
  - **Admin**: Manage user roles (promote students to faculty).
  - **Faculty**: Create quizzes, view student results, and upload study materials.
  - **Student**: Attempt quizzes, download certificates upon completion, and access study materials.
- **Quiz Management**
  - Create quizzes with multiple-choice questions.
  - Set duration, total marks, and publish status.
- **Automated Certification**
  - Dynamically generated PDF certificates using `html2canvas` and `jsPDF`.
  - Includes student score, percentage, and date of completion.
- **Study Materials**
  - Upload and share documents, PDFs, and notes.
- **Authentication & Security**
  - Secure login and registration powered by Supabase Auth.
  - Row Level Security (RLS) ensuring data privacy based on user roles.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: `jsPDF`, `html2canvas`
- **Routing**: React Router
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites
- Node.js & npm installed.

### Installation

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Environment Setup**
   The project requires a connection to a Supabase backend. If you are running this locally through Lovable, the environment variables (`.env`) are automatically configured.

4. **Start the development server**
   ```sh
   npm run dev
   ```

## 🏗️ Project Structure

- `src/components/`: Reusable UI components (including CertificateGenerator and shadcn/ui components).
- `src/pages/`: Main application pages (Dashboard, Login, Quizzes, Results, Materials, AdminPanel).
- `src/contexts/`: React contexts (e.g., AuthContext for managing user state).
- `src/lib/`: Utility functions and Supabase client configuration.
- `src/integrations/supabase/`: Auto-generated Supabase types and client setup.

## 🌐 Deployment

This project is optimized for deployment via [Lovable](https://lovable.dev/). Simply open your Lovable project and click on **Share -> Publish**.

You can also connect a custom domain by navigating to **Project > Settings > Domains**.
