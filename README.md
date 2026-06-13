# Task Manager Dashboard

A full-stack productivity dashboard built with React, Vite, Express, MongoDB, and AI-powered task insights. It helps users manage tasks, track progress, organize categories, view analytics, and get smart productivity recommendations.

## ✨ Features

- User authentication and authorization
- Create, update, delete, and organize tasks
- Kanban board and calendar-style task tracking
- Categories and task filtering
- Activity logging and notifications
- Analytics dashboard with productivity insights
- AI assistant for task recommendations and productivity coaching
- File upload support for attachments

## 🧰 Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- Recharts
- FullCalendar
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- Gemini AI integration for smart recommendations

## 📁 Project Structure

```bash
task-manager-dashboard/
├── backend/          # Express API server
├── frontend/         # React + Vite dashboard app
└── package.json      # Root scripts for running both apps
```

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (v18 or newer)
- npm
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone https://github.com/Srivijnatha/task-manager-dashboard.git
cd task-manager-dashboard
```

### 2. Install dependencies

Run the root install script:

```bash
npm run install-all
```

This installs dependencies for the root project, the backend, and the frontend.

### 3. Configure environment variables

Create a `.env` file in the `backend` folder:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> The Gemini API key is optional. If it is not provided, the app will fall back to built-in heuristic suggestions.

### 4. Run the app

From the root folder:

```bash
npm run dev
```

This starts:
- backend API on `http://localhost:5000`
- frontend dashboard on `http://localhost:5173`

## 🧪 Useful Scripts

```bash
npm run dev          # start both frontend and backend
npm run backend      # start only backend
npm run frontend     # start only frontend
npm run install-all  # install all dependencies
```

## 🧠 AI Features

The app includes:

- smart task priority recommendations
- dashboard insights
- AI chat support for planning and productivity advice

If no Gemini API key is set, the app still works using local fallback logic.

## 📌 Notes

- The backend uses CORS for local development simplicity.
- Uploads are stored in the backend `uploads` folder.
- You can customize the app further by updating the MongoDB connection and API key settings.

## 🤝 Contributing

Contributions are welcome. If you have ideas, improvements, or bug fixes, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the ISC License.
