import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    FiArrowLeft,
    FiMapPin,
    FiBriefcase,
    FiChevronDown,
    FiChevronUp,
    FiSearch,
    FiInbox,
    FiArrowRight,
    FiLoader,
    FiAlertCircle,
    FiRefreshCw
} from "react-icons/fi"
import apiCall from "../services/api"

const jobTypes = ["All", "Full-time", "Part-time", "Internship", "Remote", "Contract"]

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"



const BULLET_LIMIT = 3

const typeStyles = {
    "Full-time": "bg-indigo-50 text-indigo-600",
    "Part-time": "bg-sky-50 text-sky-600",
    Internship: "bg-amber-50 text-amber-600",
    Remote: "bg-emerald-50 text-emerald-600",
    Contract: "bg-violet-50 text-violet-600"
}

const avatarGradients = [
    "from-indigo-500 to-violet-500",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-violet-500 to-fuchsia-500"
]

function getAvatarGradient(name = "") {
    const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
    return avatarGradients[sum % avatarGradients.length]
}

function splitToItems(value) {
    if (!value) return []

    let items

    if (Array.isArray(value)) {
        items = value.map(String)
    } else {
        const lines = String(value)
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean)

        items = lines.length > 1 ? lines : (lines[0]?.match(/[^.!?]+[.!?]?/g) || lines)
    }

    return items
        .map(line => line.replace(/^[•\-*\u2022]\s*/, "").trim())
        .filter(Boolean)
}

function parseDescription(text) {
    if (!text) return []

    const lines = String(text)
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)

    if (lines.length === 1) {
        return splitToItems(lines[0]).map(item => ({
            type: "bullet",
            text: item
        }))
    }

    return lines.map(line => {
        const isHeading =
            line.endsWith(":") &&
            line.length <= 40 &&
            !/^[•\-*\u2022]/.test(line)

        return isHeading
            ? { type: "heading", text: line.slice(0, -1) }
            : {
                type: "bullet",
                text: line.replace(/^[•\-*\u2022]\s*/, "")
            }
    })
}

function DescriptionList({ text, expanded, onToggle }) {
    const blocks = parseDescription(text)
    const totalBullets = blocks.filter(block => block.type === "bullet").length

    let count = 0
    const visible = []

    for (const block of blocks) {
        if (block.type === "bullet") {
            if (!expanded && count >= BULLET_LIMIT) break
            count++
        }

        visible.push(block)
    }

    if (visible.length > 0 && visible[visible.length - 1].type === "heading") {
        visible.pop()
    }

    const hiddenCount = totalBullets - count

    return (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="space-y-2">
                {visible.map((block, index) =>
                    block.type === "heading" ? (
                        <p
                            key={index}
                            className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-900 first:pt-0"
                        >
                            {block.text}
                        </p>
                    ) : (
                        <div
                            key={index}
                            className="flex gap-3 text-sm leading-relaxed text-slate-500"
                        >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                            <span>{block.text}</span>
                        </div>
                    )
                )}
            </div>

            {totalBullets > BULLET_LIMIT && (
                <button
                    type="button"
                    onClick={onToggle}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    {expanded ? (
                        <>
                            Show less <FiChevronUp />
                        </>
                    ) : (
                        <>
                            Show {hiddenCount} more <FiChevronDown />
                        </>
                    )}
                </button>
            )}
        </div>
    )
}

function Jobs() {
    const navigate = useNavigate()

    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("All")
    const [expandedIds, setExpandedIds] = useState({})

    const token = localStorage.getItem("token")

    const getJobs = useCallback(async () => {
        try {
            setLoading(true)
            setError("")

            const result = await apiCall("/job/all-jobs", "GET", null, token)

            setJobs(result.jobs || [])
        } catch (err) {
            setError(err.message || "Failed to load available jobs")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        getJobs()
    }, [getJobs])

    const toggleExpanded = (jobId) => {
        setExpandedIds(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }))
    }

    const query = search.trim().toLowerCase()

    const filteredJobs = jobs.filter(job => {
        const matchesType =
            typeFilter === "All" || job.jobType === typeFilter

        const matchesSearch =
            !query ||
            [
                job.jobTitle,
                job.companyName,
                job.location,
                ...(job.requiredSkills || [])
            ]
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(query))

        return matchesType && matchesSearch
    })

    const companyCount = new Set(
        jobs
            .map(job => (job.companyName || "").trim().toLowerCase())
            .filter(Boolean)
    ).size

    const remoteCount = jobs.filter(job => job.jobType === "Remote").length

    const countFor = (type) =>
        type === "All"
            ? jobs.length
            : jobs.filter(job => job.jobType === type).length

    return (
        <div className="min-h-screen bg-slate-50">
            <motion.header
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"
            >
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
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
                        <h1 className="text-lg font-bold text-slate-900">
                            Available Jobs
                        </h1>
                        <p className="text-xs text-slate-500">
                            Explore opportunities and find your next job
                        </p>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8"
                >
                    <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
                    <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10" />

                    <div className="relative">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-indigo-100">
                                Career Opportunities
                            </span>

                            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                                Find your next opportunity
                            </h2>

                            <p className="mt-2 text-sm leading-relaxed text-indigo-100 sm:text-base">
                                Explore available jobs, discover companies and find opportunities that match your skills.
                            </p>
                        </div>

                        <div className="mt-7 grid grid-cols-3 gap-3 sm:max-w-md sm:gap-5">
                            <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                                <p className="text-2xl font-bold">{jobs.length}</p>
                                <p className="mt-1 text-xs text-indigo-100">Total Jobs</p>
                            </div>

                            <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                                <p className="text-2xl font-bold">{companyCount}</p>
                                <p className="mt-1 text-xs text-indigo-100">Companies</p>
                            </div>

                            <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                                <p className="text-2xl font-bold">{remoteCount}</p>
                                <p className="mt-1 text-xs text-indigo-100">Remote Jobs</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Explore Jobs
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Search and filter available opportunities
                            </p>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                            {filteredJobs.length} jobs found
                        </span>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            placeholder="Search by title, company, location or skill"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`${inputClass} pl-11`}
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {jobTypes.map(type => {
                            const active = typeFilter === type

                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTypeFilter(type)}
                                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                    }`}
                                >
                                    {type}

                                    <span
                                        className={`ml-1.5 text-xs ${
                                            active ? "text-indigo-100" : "text-slate-400"
                                        }`}
                                    >
                                        {countFor(type)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </motion.section>

                {loading ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center">
                        <FiLoader className="animate-spin text-3xl text-indigo-600" />
                        <p className="mt-3 text-sm text-slate-500">
                            Loading available jobs...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center">
                        <FiAlertCircle className="text-3xl text-rose-500" />

                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                            Unable to load jobs
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={getJobs}
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <FiRefreshCw /> Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        <AnimatePresence mode="popLayout">
                            {filteredJobs.map((job, index) => {
                                const typeStyle =
                                    typeStyles[job.jobType] || "bg-indigo-50 text-indigo-600"

                                return (
                                    <motion.div
                                        key={job._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                delay: Math.min(index, 6) * 0.05,
                                                duration: 0.35
                                            }
                                        }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg"
                                    >
                                        <div className="p-5 sm:p-6">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex min-w-0 items-start gap-4">
                                                    <div
                                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${getAvatarGradient(job.companyName)}`}
                                                    >
                                                        {(job.companyName || "?")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                                                            {job.jobTitle}
                                                        </h3>

                                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <FiBriefcase />
                                                                {job.companyName}
                                                            </span>

                                                            {job.location && (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <FiMapPin />
                                                                    {job.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${typeStyle}`}
                                                >
                                                    {job.jobType}
                                                </span>
                                            </div>

                                            <DescriptionList
                                                text={job.jobDescription}
                                                expanded={!!expandedIds[job._id]}
                                                onToggle={() => toggleExpanded(job._id)}
                                            />

                                            {job.requiredSkills?.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Required Skills
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {job.requiredSkills.map((skill, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {job.applyEnabled && job.applyLink && (
                                                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() =>
                                                            window.open(
                                                                job.applyLink,
                                                                "_blank",
                                                                "noopener,noreferrer"
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                                                    >
                                                        Apply Now <FiArrowRight />
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>

                        {filteredJobs.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center"
                            >
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                    {jobs.length === 0 ? <FiInbox /> : <FiSearch />}
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900">
                                    {jobs.length === 0
                                        ? "No jobs available"
                                        : "No jobs match your search"}
                                </h3>

                                <p className="mt-2 max-w-sm text-sm text-slate-500">
                                    {jobs.length === 0
                                        ? "There are currently no job opportunities available. Please check back later."
                                        : "Try a different keyword or choose another job type."}
                                </p>

                                {jobs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("")
                                            setTypeFilter("All")
                                        }}
                                        className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Jobs