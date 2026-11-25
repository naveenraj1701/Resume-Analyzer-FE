
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, scale } from "framer-motion"
import {
    FiArrowLeft,
    FiPlus,
    FiSave,
    FiEdit2,
    FiTrash2,
    FiMapPin,
    FiBriefcase,
    FiX,
    FiCheckCircle,
    FiAlertCircle,
    FiLoader,
    FiInbox,
    FiLink,
    FiZap,
    FiChevronDown,
    FiChevronUp,
    FiSearch,
    FiArrowRight
} from "react-icons/fi"
import apiCall, { extractJobFromURL } from "../services/api"

const emptyForm = {
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    requiredSkills: "",
    location: "",
    jobType: "Full-time"
}

const jobTypes = ["Full-time", "Part-time", "Internship", "Remote", "Contract"]

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

const labelClass = "mb-1.5 block text-sm font-medium text-slate-900"

const scrollClass = "overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"

const BULLET_LIMIT = 3

const typeStyles = {
    "Full-time": { badge: "bg-indigo-50 text-indigo-600", accent: "bg-indigo-600" },
    "Part-time": { badge: "bg-sky-50 text-sky-600", accent: "bg-sky-500" },
    Internship: { badge: "bg-amber-50 text-amber-600", accent: "bg-amber-500" },
    Remote: { badge: "bg-emerald-50 text-emerald-600", accent: "bg-emerald-500" },
    Contract: { badge: "bg-violet-50 text-violet-600", accent: "bg-violet-500" },
}

const defaultTypeStyle = {
    badge: "bg-indigo-50 text-indigo-600",
    accent: "bg-indigo-600"
}

const avatarGradients = [
    "from-indigo-500 to-violet-500",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-violet-500 to-fuchsia-500",
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

function formatSection(title, items) {
    if (items.length === 0) return ""
    return `${title}:\n` + items.map(text => `• ${text}`).join("\n")
}

function parseDescription(text) {
    if (!text) return []

    const lines = String(text)
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)

    if (lines.length === 1) {
        return splitToItems(lines[0]).map(item => ({ type: "bullet", text: item }))
    }

    return lines.map(line => {
        const isHeading = line.endsWith(":") && line.length <= 40 && !/^[•\-*\u2022]/.test(line)

        return isHeading
            ? { type: "heading", text: line.slice(0, -1) }
            : { type: "bullet", text: line.replace(/^[•\-*\u2022]\s*/, "") }
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
                        <div key={index} className="flex gap-3 text-sm leading-relaxed text-slate-500">
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
    const leftPanelRef = useRef(null)

    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")
    const [editId, setEditId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [expandedIds, setExpandedIds] = useState({})

    const [form, setForm] = useState(emptyForm)
    const [jobURL, setJobURL] = useState("")
    const [extracting, setExtracting] = useState(false)

    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("All")
    const [applyEnabled, setApplyEnabled] = useState(false)
    const [applyLink, setApplyLink] = useState("")

    const token = localStorage.getItem("token")

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const getJobs = useCallback(async () => {
        try {
            const result = await apiCall("/job/all-jobs", "GET", null, token)
            setJobs(result.jobs || [])
        } catch (err) {
            setMessage(err.message)
            setMessageType("error")
        }
    }, [token])

    useEffect(() => {
        getJobs()
    }, [getJobs])

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const toggleExpanded = (jobId) => {
        setExpandedIds(prev => ({ ...prev, [jobId]: !prev[jobId] }))
    }

    const handleExtractJob = async () => {
        if (!jobURL.trim()) {
            notify("Please enter a job URL", "error")
            return
        }

        try {
            setExtracting(true)
            setMessage("")

            const result = await extractJobFromURL(jobURL, token)

            if (!result.success) {
                throw new Error(result.message || "Failed to extract job details")
            }

            const details = result.jobDetails

            const overview = formatSection("Overview", splitToItems(details.jobDescription))
            const responsibilities = formatSection("Responsibilities", splitToItems(details.responsibilities))
            const qualifications = formatSection("Qualifications", splitToItems(details.qualifications))

            const jobDescription = [overview, responsibilities, qualifications]
                .filter(Boolean)
                .join("\n\n")

            const matchedJobType = jobTypes.find(
                type => type.toLowerCase() === details.jobType?.toLowerCase()
            )

            setForm({
                jobTitle: details.jobTitle || "",
                companyName: details.companyName || "",
                jobDescription,
                requiredSkills: (details.requiredSkills || []).join(", "),
                location: details.location || "",
                jobType: matchedJobType || "Full-time"
            })

            setEditId(null)
            notify("Job details extracted successfully. Review the information before creating the job.")
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setExtracting(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)

            if (applyEnabled && !applyLink.trim()) {
                notify("Please enter the application URL", "error")
                return
            }

            if (applyEnabled) {
                try {
                    new URL(applyLink.trim())
                } catch {
                    notify("Please enter a valid application URL", "error")
                    return
                }
            }

            const jobData = {
                ...form,
                requiredSkills: form.requiredSkills
                    .split(",")
                    .map(skill => skill.trim())
                    .filter(Boolean),
                applyEnabled,
                applyLink: applyEnabled ? applyLink.trim() : ""
            }

            if (editId) {
                await apiCall(`/job/update-job/${editId}`, "PUT", jobData, token)
                notify("Job updated successfully")
            } else {
                await apiCall("/job/create-job", "POST", jobData, token)
                notify("Job created successfully")
            }

            setForm(emptyForm)
            setJobURL("")
            setApplyEnabled(false)
            setApplyLink("")
            setEditId(null)
            await getJobs()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (job) => {
        setEditId(job._id)

        setForm({
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            jobDescription: job.jobDescription,
            requiredSkills: (job.requiredSkills || []).join(", "),
            location: job.location || "",
            jobType: job.jobType || "Full-time"
        })

        setApplyEnabled(!!job.applyEnabled)
        setApplyLink(job.applyLink || "")

        leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleCancelEdit = () => {
        setEditId(null)
        setForm(emptyForm)
        setApplyEnabled(false)
        setApplyLink("")
    }

    const handleDelete = async (jobId) => {
        try {
            setDeletingId(jobId)
            await apiCall(`/job/delete-job/${jobId}`, "DELETE", null, token)
            notify("Job deleted successfully")
            await getJobs()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setDeletingId(null)
        }
    }

    const companyCount = new Set(
        jobs.map(job => (job.companyName || "").trim().toLowerCase()).filter(Boolean)
    ).size

    const remoteCount = jobs.filter(job => job.jobType === "Remote").length

    const query = search.trim().toLowerCase()

    const filteredJobs = jobs.filter(job => {
        const matchesType = typeFilter === "All" || job.jobType === typeFilter

        const matchesSearch =
            !query ||
            [job.jobTitle, job.companyName, job.location, ...(job.requiredSkills || [])]
                .filter(Boolean)
                .some(value => String(value).toLowerCase().includes(query))

        return matchesType && matchesSearch
    })

    const filters = ["All", ...jobTypes]

    const countFor = (type) =>
        type === "All" ? jobs.length : jobs.filter(job => job.jobType === type).length

    return (
        <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
            <motion.header
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur"
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
                        <h1 className="text-lg font-bold text-slate-900">Job Management</h1>
                        <p className="text-xs text-slate-500">
                            Create and manage job descriptions
                        </p>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 lg:min-h-0 lg:flex-1 lg:grid-cols-5">
                <div
                    ref={leftPanelRef}
                    className={`space-y-6 lg:col-span-2 lg:min-h-0 lg:pb-2 lg:pr-2 ${scrollClass}`}
                >
                    <motion.section
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg"
                    >
                        <motion.div
                            animate={{ y: [0, 14, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10"
                        />
                        <motion.div
                            animate={{ y: [0, -14, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10"
                        />

                        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4 text-white shadow-md">
                            <div>
                                <p className="text-xs text-indigo-100">Your job board</p>
                                <h2 className="text-lg font-bold">Add jobs, find your match</h2>
                            </div>

                            <div className="flex gap-4 text-center">
                                <div>
                                    <p className="text-xl font-bold">{jobs.length}</p>
                                    <p className="text-xs text-indigo-100">Jobs</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{companyCount}</p>
                                    <p className="text-xs text-indigo-100">Companies</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{remoteCount}</p>
                                    <p className="text-xs text-indigo-100">Remote</p>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.form
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <AnimatePresence initial={false}>
                            {!editId && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white">
                                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />

                                        <div className="relative">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl">
                                                    <FiZap />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">Import with AI</h3>
                                                    <p className="text-xs text-indigo-100">
                                                        Paste a job link and we fill the form
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative mt-4">
                                                <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    inputMode="url"
                                                    placeholder="https://company.com/careers/job"
                                                    value={jobURL}
                                                    onChange={(e) => setJobURL(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                            if (!extracting && jobURL.trim()) handleExtractJob()
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60"
                                                />
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: extracting ? 1 : 1.02 }}
                                                whileTap={{ scale: extracting ? 1 : 0.97 }}
                                                type="button"
                                                onClick={handleExtractJob}
                                                disabled={extracting || !jobURL.trim()}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {extracting ? (
                                                    <>
                                                        <FiLoader className="animate-spin" />
                                                        Extracting job details...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiZap />
                                                        Extract with AI
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="my-6 flex items-center gap-3">
                                        <span className="h-px flex-1 bg-slate-200" />
                                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                            or fill in manually
                                        </span>
                                        <span className="h-px flex-1 bg-slate-200" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    {editId ? <FiEdit2 /> : <FiPlus />}
                                </span>
                                {editId ? "Update Job" : "Create Job"}
                            </h2>

                            {editId && (
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                    Editing
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Job Title</label>
                                <input
                                    name="jobTitle"
                                    placeholder="Frontend Developer"
                                    value={form.jobTitle}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Company Name</label>
                                <input
                                    name="companyName"
                                    placeholder="Acme Technologies"
                                    value={form.companyName}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Job Description</label>
                                <textarea
                                    name="jobDescription"
                                    placeholder={"• Write one point per line\n• Use a heading line ending with a colon, like Responsibilities:"}
                                    value={form.jobDescription}
                                    onChange={handleChange}
                                    className={`${inputClass} leading-relaxed`}
                                    rows="8"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    One point per line. It shows as bullet points on the job card.
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>Required Skills</label>
                                <input
                                    name="requiredSkills"
                                    placeholder="JavaScript, React, Node.js"
                                    value={form.requiredSkills}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-slate-500">Separate skills with commas</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Apply Now button</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Enable this only when you have an external application link.
                                        </p>
                                    </div>
                                    <motion.button
                                        type="button"
                                        onClick={() => {
                                            setApplyEnabled(!applyEnabled)
                                            if (applyEnabled) setApplyLink("")
                                        }}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                                            applyEnabled
                                                ? "bg-emerald-600 hover:bg-emerald-700"
                                                : "bg-slate-500 hover:bg-slate-600"
                                        }`}
                                    >
                                        {applyEnabled ? "Enabled" : "Disabled"}
                                    </motion.button>
                                </div>

                                {applyEnabled && (
                                    <div className="mt-4">
                                        <label className={labelClass}>Application URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://company.com/careers/apply"
                                            value={applyLink}
                                            onChange={(e) => setApplyLink(e.target.value)}
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Location</label>
                                    <input
                                        name="location"
                                        placeholder="Chennai"
                                        value={form.location}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Job Type</label>
                                    <select
                                        name="jobType"
                                        value={form.jobType}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        {jobTypes.map(type => (
                                            <option key={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <motion.button
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.97 }}
                                type="submit"
                                disabled={loading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        {editId ? <FiSave /> : <FiPlus />}
                                        {editId ? "Update Job" : "Create Job"}
                                    </>
                                )}
                            </motion.button>

                            {editId && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
                                >
                                    <FiX /> Cancel
                                </motion.button>
                            )}
                        </div>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    key={message}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${messageType === "error"
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
                </div>

                <section className="flex flex-col lg:col-span-3 lg:min-h-0">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
                        className="mb-4 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Available Jobs</h2>
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                {filteredJobs.length} shown
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

                        <div className="mt-3 flex flex-wrap gap-2">
                            {filters.map(type => {
                                const active = typeFilter === type

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setTypeFilter(type)}
                                        className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active
                                                ? "text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                            }`}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="job-filter-pill"
                                                className="absolute inset-0 rounded-full bg-indigo-600"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10">
                                            {type}
                                            <span className={`ml-1.5 text-xs ${active ? "text-indigo-100" : "text-slate-400"}`}>
                                                {countFor(type)}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>

                    <div
                        className={`-mx-1 max-h-[75vh] px-1 pb-2 lg:max-h-none lg:min-h-0 lg:flex-1 ${scrollClass}`}
                    >
                        <div className="relative grid gap-5">
                            <AnimatePresence mode="popLayout">
                                {filteredJobs.map((job, index) => {
                                    const typeStyle = typeStyles[job.jobType] || defaultTypeStyle

                                    return (
                                        <motion.div
                                            key={job._id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: Math.min(index, 6) * 0.05, duration: 0.35 }
                                            }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow] hover:shadow-xl ${editId === job._id
                                                    ? "border-indigo-600"
                                                    : "border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span className={`absolute left-0 top-0 h-full w-1.5 ${typeStyle.accent}`} />

                                            <div className="p-5 pl-7">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex min-w-0 items-start gap-4">
                                                        <div
                                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${getAvatarGradient(job.companyName)}`}
                                                        >
                                                            {(job.companyName || "?").charAt(0).toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h3 className="text-lg font-semibold text-slate-900">
                                                                {job.jobTitle}
                                                            </h3>

                                                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <FiBriefcase /> {job.companyName}
                                                                </span>
                                                                {job.location && (
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <FiMapPin /> {job.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${typeStyle.badge}`}
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
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {job.requiredSkills.map((skill, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleEdit(job)}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                                                    >
                                                        <FiEdit2 /> Edit
                                                    </motion.button>

                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDelete(job._id)}
                                                        disabled={deletingId === job._id}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                                                    >
                                                        {deletingId === job._id ? (
                                                            <FiLoader className="animate-spin" />
                                                        ) : (
                                                            <FiTrash2 />
                                                        )}
                                                        Delete
                                                    </motion.button>
                                                    {job.applyEnabled && job.applyLink && (
                                                        <motion.button
                                                            type="button"
                                                            whileHover={{ scale: 1.04 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => window.open(job.applyLink, "_blank", "noopener,noreferrer")}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                                                        >
                                                            Apply Now <FiArrowRight />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>

                            {filteredJobs.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                        {jobs.length === 0 ? <FiInbox /> : <FiSearch />}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {jobs.length === 0 ? "No jobs available" : "No jobs match your search"}
                                    </h3>
                                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                                        {jobs.length === 0
                                            ? "Create your first job, or import one from a link with AI."
                                            : "Try a different keyword or choose another job type."}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Jobs
