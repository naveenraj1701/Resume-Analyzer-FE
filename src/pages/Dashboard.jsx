import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FiFileText, FiBriefcase, FiZap, FiLogOut, FiArrowRight, FiMessageSquare } from "react-icons/fi"
import Payment from "../components/Payment/JobMatchPayment"
import apiCall from "../services/api"

// Animation variants
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
}

function FeatureCard({ to, icon, title, description, badge }) {
    return (
        <motion.div
            variants={item}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
        >
            <Link
                to={to}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[border-color,box-shadow] hover:border-indigo-200 hover:shadow-xl"
            >
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                        {icon}
                    </div>
                    {badge}
                </div>

                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
                    Open
                    <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </span>
            </Link>
        </motion.div>
    )
}

function Dashboard() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user"))

    const [isPaid, setIsPaid] = useState(false)
    const [loading, setLoading] = useState(true)

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/")
    }

    useEffect(() => {
        const checkPayment = async () => {
            try {
                const token = localStorage.getItem("token")
                const result = await apiCall(
                    "/payment/payment-status",
                    "GET",
                    null,
                    token
                )

                setIsPaid(result.paid)
            } catch (err) {
                console.log("Payment status error:", err.message)
            } finally {
                setLoading(false)
            }
        }

        checkPayment()
    }, [])

    const name = user?.name || "User"
    const initial = name.charAt(0).toUpperCase()

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top bar */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: -8, scale: 1.08 }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white shadow-sm"
                        >
                            <FiFileText />
                        </motion.div>
                        <span className="text-lg font-bold text-slate-900">
                            AI Resume Analyzer
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden items-center gap-3 sm:flex">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                                {initial}
                            </div>
                            <span className="text-sm font-medium text-slate-900">{name}</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                            <FiLogOut />
                            Logout
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                {/* Welcome banner */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-10 text-white shadow-lg"
                >
                    <motion.div
                        animate={{ y: [0, 14, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
                    />
                    <motion.div
                        animate={{ y: [0, -14, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10"
                    />

                    <div className="relative">
                        <p className="text-sm font-medium text-indigo-100">Dashboard</p>
                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Welcome back, {name}! 👋
                        </h1>
                        <p className="mt-3 max-w-xl text-indigo-100">
                            Manage your resume and find suitable job opportunities, all
                            powered by AI.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/resume"
                                    className="block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"
                                >
                                    Analyze my resume
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/jobs"
                                    className="block rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                >
                                    Career Opportunities
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* Tools */}
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mb-5 mt-10 text-xl font-semibold text-slate-900"
                >
                    Your tools
                </motion.h2>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-6 md:grid-cols-3"
                >
                    <FeatureCard
                        to="/resume"
                        icon={<FiFileText />}
                        title="Resume Analyzer"
                        description="Upload and analyze your resume using AI."
                    />

                    <FeatureCard
                        to="/jobs"
                        icon={<FiBriefcase />}
                        title="Explore Opportunities"
                        description="Discover available jobs and find opportunities that match your skills."
                    />

                    {/* <FeatureCard
                        to="/applications"
                        icon={<FiBriefcase />}
                        title="Application Tracker"
                        description="Track your job applications, interview status, offers, and notes."
                    /> */}
                    <FeatureCard
                        to="/interview-preparation"
                        icon={<FiMessageSquare />}
                        title="AI Interview Preparation"
                        description="Generate personalized interview questions and prepare for job interviews using AI."
                    />
                    {loading ? (
                        <motion.div
                            variants={item}
                            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="mb-5 h-12 w-12 rounded-xl bg-slate-200" />
                            <div className="h-5 w-2/3 rounded bg-slate-200" />
                            <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                            <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                            <p className="mt-6 text-sm text-slate-500">
                                Checking payment status...
                            </p>
                        </motion.div>
                    ) : isPaid ? (
                        <FeatureCard
                            to="/job-match"
                            icon={<FiZap />}
                            title="Job Matching"
                            description="Compare your resume with job requirements."
                            badge={
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                    Unlocked
                                </span>
                            }
                        />
                    ) : (
                        <motion.div
                            variants={item}
                            className="flex flex-col rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-6 shadow-sm"
                        >
                            <div className="mb-5 flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600">
                                    <FiZap />
                                </div>
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                    Premium
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900">
                                Unlock Job Matching
                            </h3>
                            <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-500">
                                Pay <span className="font-semibold text-slate-900">₹500</span>{" "}
                                once to access AI Job Matching.
                            </p>

                            <div className="mt-auto">
                                <Payment />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    )
}

export default Dashboard