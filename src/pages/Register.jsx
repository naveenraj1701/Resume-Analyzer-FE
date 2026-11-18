import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    FiUser,
    FiMail,
    FiLock,
    FiEye,
    FiEyeOff,
    FiUserPlus,
    FiLoader,
    FiAlertCircle,
    FiCheckCircle,
    FiFileText,
    FiUploadCloud,
    FiCpu,
    FiTarget,
} from "react-icons/fi"
import apiCall from "../services/api"

const steps = [
    { icon: <FiUploadCloud />, title: "Upload your resume", text: "Add your PDF resume in a few seconds." },
    { icon: <FiCpu />, title: "Get AI feedback", text: "See your score, strengths and what to improve." },
    { icon: <FiTarget />, title: "Match with jobs", text: "Find out how well you fit each role." },
]

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

function Register() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)
            setMessage("")

            const result = await apiCall("/user/register", "POST", {
                name,
                email,
                password
            })

            setMessage(result.message || "Account created successfully")
            setMessageType("success")

            // Short pause so the success message is visible before redirecting
            setTimeout(() => navigate("/"), 1200)
        } catch (err) {
            setMessage(err.message)
            setMessageType("error")
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
            {/* Form panel */}
            <div className="flex items-center justify-center px-6 py-12 lg:order-1">
                <motion.form
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    onSubmit={handleRegister}
                    className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
                >
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600">
                            <FiUserPlus />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Sign up to start analyzing your resume
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-900">
                                Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-900">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-900">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputClass} pr-11`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div
                                    className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                                        messageType === "error"
                                            ? "border-rose-200 bg-rose-50 text-rose-600"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-600"
                                    }`}
                                >
                                    <span className="mt-0.5 text-base">
                                        {messageType === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
                                    </span>
                                    <p>{message}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.97 }}
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <FiLoader className="animate-spin" /> Creating account...
                            </>
                        ) : (
                            <>
                                <FiUserPlus /> Register
                            </>
                        )}
                    </motion.button>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link to="/" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Login
                        </Link>
                    </p>
                </motion.form>
            </div>

            {/* Brand panel */}
            <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 p-12 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
                <motion.div
                    animate={{ y: [0, 16, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10"
                />
                <motion.div
                    animate={{ y: [0, -16, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/10"
                />

                <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl text-indigo-600 shadow-sm">
                        <FiFileText />
                    </div>
                    <span className="text-xl font-bold">AI Resume Analyzer</span>
                </div>

                <div className="relative">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold leading-tight"
                    >
                        Start building a stronger resume today.
                    </motion.h2>

                    <div className="mt-10 space-y-6">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.15, duration: 0.45 }}
                                className="flex items-start gap-4"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl">
                                    {step.icon}
                                </div>
                                <div>
                                    <p className="font-semibold">{step.title}</p>
                                    <p className="text-sm text-indigo-100">{step.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <p className="relative text-sm text-indigo-100">
                    Upload your resume. Match it with jobs. Improve faster.
                </p>
            </div>
        </div>
    )
}

export default Register