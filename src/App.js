import { BrowserRouter, Routes, Route } from "react-router-dom"
import Register from "./pages/Register"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Resume from "./pages/Resume"
import Jobs from "./pages/Jobs"
import ProtectedJobMatch from "./components/Payment/ProtectedJobMatch"
import ApplicationTracker from "./pages/ApplicationTracker"
import InterviewPreparation from "./pages/InterviewPreparation"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/job-match" element={<ProtectedJobMatch />} />
                <Route path="/applications" element={<ApplicationTracker />} />
                <Route path="/interview-preparation" element={<InterviewPreparation />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App