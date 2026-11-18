import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, animate } from "framer-motion"
import {
    FiArrowLeft,
    FiTarget,
    FiFileText,
    FiBriefcase,
    FiCheck,
    FiX,
    FiCheckCircle,
    FiAlertCircle,
    FiTrendingUp,
    FiInfo,
    FiEye,
    FiTrash2,
    FiLoader,
    FiClock,
    FiInbox,
    FiZap,
    FiPieChart,
} from "react-icons/fi"
import apiCall from "../services/api"

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
}

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

const labelClass = "mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-900"

function getScoreStyle(score) {
    const value = Number(score) || 0

    if (value >= 75) {
        return {
            bar: "bg-emerald-500",
            text: "text-emerald-600",
            badge: "bg-emerald-50 text-emerald-600",
            stroke: "stroke-emerald-500",
            label: "Strong match",
        }
    }
    if (value >= 50) {
        return {
            bar: "bg-amber-500",
            text: "text-amber-600",
            badge: "bg-amber-50 text-amber-600",
            stroke: "stroke-amber-500",
            label: "Moderate match",
        }
    }
    return {
        bar: "bg-rose-500",
        text: "text-rose-600",
        badge: "bg-rose-50 text-rose-600",
        stroke: "stroke-rose-500",
        label: "Low match",
    }
}

// "skillsMatch" or "skills_match" -> "skills Match" (capitalized by CSS)
function formatLabel(text) {
    return String(text).replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim()
}

// Number that counts up from 0 to the given value
function CountUp({ value }) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        const controls = animate(0, Number(value) || 0, {
            duration: 1,
            ease: "easeOut",
            onUpdate: (v) => setDisplay(Math.round(v)),
        })

        return () => controls.stop()
    }, [value])

    return <>{display}</>
}

// Circular progress ring
function ScoreRing({ value, size = 96, stroke = 8, textClass = "text-xl", delay = 0 }) {
    const percent = Math.min(Math.max(Number(value) || 0, 0), 100)
    const style = getScoreStyle(percent)

    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-slate-100"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
                    transition={{ duration: 1.1, ease: "easeOut", delay }}
                    className={style.stroke}
                />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-bold ${style.text} ${textClass}`}>
                    <CountUp value={percent} />
                    <span className="text-[0.55em] font-semibold">%</span>
                </span>
            </div>
        </div>
    )
}

function ListSection({ title, icon, iconClass, dotClass, items }) {
    if (!items || items.length === 0) return null

    return (
        <motion.div variants={item} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                <span className={`text-lg ${iconClass}`}>{icon}</span>
                {title}
            </h3>
            <ul className="space-y-2">
                {items.map((text, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-500">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
                        <span>{text}</span>
                    </li>
                ))}
            </ul>
        </motion.div>
    )
}

function JobMatch() {
    const navigate = useNavigate()

    const [resumes, setResumes] = useState([])
    const [jobs, setJobs] = useState([])
    const [matches, setMatches] = useState([])
    const [resumeId, setResumeId] = useState("")
    const [jobId, setJobId] = useState("")
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")

    const token = localStorage.getItem("token")

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const getData = useCallback(async () => {
        try {
            const result = await apiCall("/resume/all-resumes", "GET", null, token)
            setResumes(result.resumes || [])
        } catch (err) {
            console.log("Resume error:", err.message)
            setMessage("Resume: " + err.message)
            setMessageType("error")
        }

        try {
            const result = await apiCall("/job/all-jobs", "GET", null, token)
            setJobs(result.jobs || [])
        } catch (err) {
            console.log("Job error:", err.message)
            setMessage("Job: " + err.message)
            setMessageType("error")
        }

        try {
            const result = await apiCall("/job-match/all-matches", "GET", null, token)
            setMatches(result.matches || [])
        } catch (err) {
            console.log("Match error:", err.message)
        }
    }, [token])

    useEffect(() => {
        getData()
    }, [getData])

    const handleMatch = async (e) => {
        e.preventDefault()

        if (!resumeId || !jobId) {
            notify("Please select a resume and job", "error")
            return
        }

        try {
            setLoading(true)
            setAnalysis(null)
            setMessage("")

            const result = await apiCall(
                "/job-match/create-match",
                "POST",
                { resumeId, jobId },
                token
            )

            setAnalysis(result.match || result.jobMatch || result)
            notify(result.message || "Job matching completed successfully")

            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const handleViewMatch = async (matchId) => {
        try {
            const result = await apiCall(
                `/job-match/single-match/${matchId}`,
                "GET",
                null,
                token
            )

            setAnalysis(result.match || result.jobMatch || result)
            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch (err) {
            notify(err.message, "error")
        }
    }

    const handleDeleteMatch = async (matchId) => {
        try {
            setDeletingId(matchId)

            await apiCall(
                `/job-match/delete-match/${matchId}`,
                "DELETE",
                null,
                token
            )

            notify("Match deleted successfully")
            setAnalysis(null)
            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setDeletingId(null)
        }
    }

    const score = Number(analysis?.matchScore) || 0
    const scoreStyle = getScoreStyle(score)
    const canMatch = resumes.length > 0 && jobs.length > 0

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top bar */}
            <motion.header
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur"
            >
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
                    <motion.button
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                        aria-label="Go back"
                    >
                        <FiArrowLeft />
                    </motion.button>

                    <div>
                        <h1 className="text-lg font-bold text-slate-900">AI Job Matching</h1>
                        <p className="text-xs text-slate-500">
                            Compare your resume with job requirements
                        </p>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        onSubmit={handleMatch}
                        className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:col-span-2"
                    >
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FiTarget />
                            </span>
                            Compare Resume with Job
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>
                                    <FiFileText className="text-indigo-600" /> Select Resume
                                </label>
                                <select
                                    value={resumeId}
                                    onChange={(e) => setResumeId(e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Choose Resume</option>

                                    {resumes.map(resume => (
                                        <option key={resume._id} value={resume._id}>
                                            {resume.fileName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <FiBriefcase className="text-indigo-600" /> Select Job
                                </label>
                                <select
                                    value={jobId}
                                    onChange={(e) => setJobId(e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Choose Job</option>

                                    {jobs.map(job => (
                                        <option key={job._id} value={job._id}>
                                            {job.jobTitle} - {job.companyName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!canMatch && (
                            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                You need at least one uploaded resume and one job to run a match.
                            </p>
                        )}

                        <motion.button
                            whileHover={{ scale: loading || !canMatch ? 1 : 1.02 }}
                            whileTap={{ scale: loading || !canMatch ? 1 : 0.97 }}
                            type="submit"
                            disabled={loading || !canMatch}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin" /> Analyzing with Gemini...
                                </>
                            ) : (
                                <>
                                    <FiZap /> Find Job Match
                                </>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    key={message}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.form>

                    {/* Result */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex min-h-[320px] animate-pulse flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                        <FiLoader className="animate-spin" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Matching your resume...
                                    </h2>
                                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                                        This can take a few seconds while the AI compares your skills
                                        with the job requirements.
                                    </p>
                                </motion.div>
                            ) : analysis ? (
                                <motion.div
                                    key="analysis"
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="space-y-4"
                                >
                                    {/* Overall score */}
                                    <motion.div
                                        variants={item}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                                            <ScoreRing
                                                value={score}
                                                size={140}
                                                stroke={12}
                                                textClass="text-4xl"
                                                delay={0.2}
                                            />

                                            <div className="text-center sm:text-left">
                                                <p className="text-sm font-medium text-slate-500">
                                                    Overall result
                                                </p>
                                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                                    Job Match Result
                                                </h2>
                                                <span
                                                    className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${scoreStyle.badge}`}
                                                >
                                                    {scoreStyle.label}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Score breakdown (one ring per category) */}
                                    {analysis.scoreBreakdown &&
                                        Object.keys(analysis.scoreBreakdown).length > 0 && (
                                            <motion.div
                                                variants={item}
                                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                            >
                                                <h3 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
                                                    <FiPieChart className="text-lg text-indigo-600" />
                                                    Score Breakdown
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                                    {Object.entries(analysis.scoreBreakdown).map(
                                                        ([category, value], index) => (
                                                            <motion.div
                                                                key={category}
                                                                whileHover={{ y: -4 }}
                                                                className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-indigo-200 hover:bg-white"
                                                            >
                                                                <ScoreRing
                                                                    value={value}
                                                                    size={96}
                                                                    stroke={8}
                                                                    textClass="text-xl"
                                                                    delay={0.3 + index * 0.12}
                                                                />
                                                                <p className="mt-3 text-center text-sm font-medium capitalize text-slate-900">
                                                                    {formatLabel(category)}
                                                                </p>
                                                            </motion.div>
                                                        )
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                    {/* Matched skills */}
                                    {analysis.matchedSkills?.length > 0 && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiCheckCircle className="text-lg text-emerald-600" />
                                                Matched Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.matchedSkills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600"
                                                    >
                                                        <FiCheck /> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Missing skills */}
                                    {analysis.missingSkills?.length > 0 && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiAlertCircle className="text-lg text-rose-600" />
                                                Missing Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.missingSkills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600"
                                                    >
                                                        <FiX /> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Experience match */}
                                    {analysis.experienceMatch && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiBriefcase className="text-lg text-indigo-600" />
                                                Experience Compatibility
                                            </h3>

                                            <p className="text-sm leading-relaxed text-slate-500">
                                                {analysis.experienceMatch}
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* AI explanation */}
                                    {analysis.explanation && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiInfo className="text-lg text-indigo-600" />
                                                AI Match Explanation
                                            </h3>

                                            <p className="text-sm leading-relaxed text-slate-500">
                                                {analysis.explanation}
                                            </p>
                                        </motion.div>
                                    )}

                                    <ListSection
                                        title="Strengths"
                                        icon={<FiTrendingUp />}
                                        iconClass="text-emerald-600"
                                        dotClass="bg-emerald-600"
                                        items={analysis.strengths}
                                    />
                                    <ListSection
                                        title="Suggestions"
                                        icon={<FiInfo />}
                                        iconClass="text-amber-600"
                                        dotClass="bg-amber-600"
                                        items={analysis.suggestions}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                        <FiTarget />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Your match result will appear here
                                    </h2>
                                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                                        Choose a resume and a job, then run the match to see your score,
                                        matched skills and missing skills.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Previous matches */}
                <section className="mt-10">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
                        <FiClock className="text-indigo-600" />
                        Previous Job Matches
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <AnimatePresence mode="popLayout">
                            {matches.map((match, index) => {
                                const style = getScoreStyle(match.matchScore)

                                return (
                                    <motion.div
                                        key={match._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { delay: index * 0.05, duration: 0.35 }
                                        }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -3 }}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-indigo-200 hover:shadow-lg"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-slate-900">
                                                    {match.jobId?.jobTitle || "Job"}
                                                </h3>
                                                <p className="mt-1 truncate text-sm text-slate-500">
                                                    {match.jobId?.companyName || ""}
                                                </p>
                                            </div>

                                            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
                                                {match.matchScore}%
                                            </span>
                                        </div>

                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full rounded-full ${style.bar}`}
                                                style={{ width: `${Math.min(Number(match.matchScore) || 0, 100)}%` }}
                                            />
                                        </div>

                                        <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleViewMatch(match._id)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                                            >
                                                <FiEye /> View
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDeleteMatch(match._id)}
                                                disabled={deletingId === match._id}
                                                className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                                            >
                                                {deletingId === match._id ? (
                                                    <FiLoader className="animate-spin" />
                                                ) : (
                                                    <FiTrash2 />
                                                )}
                                                Delete
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    {matches.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center"
                        >
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-600">
                                <FiInbox />
                            </div>
                            <p className="text-sm text-slate-500">No previous matches available.</p>
                        </motion.div>
                    )}
                </section>
            </main>
        </div>
    )
}

export default JobMatch