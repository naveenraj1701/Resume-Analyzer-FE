
import { Fragment, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    FiArrowLeft,
    FiUploadCloud,
    FiFileText,
    FiExternalLink,
    FiCpu,
    FiAlignLeft,
    FiCheck,
    FiX,
    FiCheckCircle,
    FiAlertCircle,
    FiZap,
    FiLoader,
    FiAward,
    FiBriefcase,
    FiInfo,
    FiRefreshCw,
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

const steps = [
    { label: "Upload", icon: <FiUploadCloud /> },
    { label: "Extract text", icon: <FiAlignLeft /> },
    { label: "AI analysis", icon: <FiCpu /> },
]

const stepText = {
    1: "Uploading your resume...",
    2: "Extracting text from your PDF...",
    3: "Analyzing your resume with AI...",
}

function Stepper({ currentStep, failedStep }) {
    return (
        <div className="flex items-start">
            {steps.map((step, index) => {
                const number = index + 1
                const isFailed = failedStep === number
                const isDone = !isFailed && currentStep > number
                const isActive = !isFailed && currentStep === number

                let circleClass = "border-slate-200 bg-slate-100 text-slate-400"
                if (isFailed) circleClass = "border-rose-600 bg-rose-50 text-rose-600"
                else if (isDone) circleClass = "border-indigo-600 bg-indigo-600 text-white"
                else if (isActive) circleClass = "border-indigo-600 bg-white text-indigo-600"

                let labelClass = "text-slate-400"
                if (isFailed) labelClass = "text-rose-600"
                else if (isDone || isActive) labelClass = "text-slate-900"

                return (
                    <Fragment key={step.label}>
                        <div className="flex w-24 shrink-0 flex-col items-center sm:w-28">
                            <div className="relative">
                                {isActive && (
                                    <motion.span
                                        className="absolute inset-0 rounded-full bg-indigo-600/30"
                                        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                                    />
                                )}

                                <motion.div
                                    animate={{ scale: isActive ? 1.1 : 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg transition-colors duration-300 ${circleClass}`}
                                >
                                    {isFailed ? (
                                        <FiX />
                                    ) : isDone ? (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <FiCheck />
                                        </motion.span>
                                    ) : isActive ? (
                                        <FiLoader className="animate-spin" />
                                    ) : (
                                        step.icon
                                    )}
                                </motion.div>
                            </div>

                            <p className={`mt-2 text-center text-xs font-medium transition-colors sm:text-sm ${labelClass}`}>
                                {step.label}
                            </p>
                        </div>

                        {index < steps.length - 1 && (
                            <div className="relative mt-5 h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: currentStep > number && !isFailed ? "100%" : "0%" }}
                                    transition={{ duration: 0.7, ease: "easeInOut" }}
                                    className="h-full rounded-full bg-indigo-600"
                                />

                                {isActive && (
                                    <motion.div
                                        className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-indigo-600/40 to-transparent"
                                        animate={{ left: ["-33%", "100%"] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                            </div>
                        )}
                    </Fragment>
                )
            })}
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

function Resume() {
    const navigate = useNavigate()

    const [file, setFile] = useState(null)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [dragActive, setDragActive] = useState(false)
    const [resume, setResume] = useState(null)
    const [analysis, setAnalysis] = useState(null)

    const [currentStep, setCurrentStep] = useState(0)
    const [failedStep, setFailedStep] = useState(0)

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const restoreResumeData = (resumeData) => {
        if (!resumeData) return

        setResume(resumeData)

        let feedback = {}

        try {
            feedback = typeof resumeData.feedback === "string"
                ? JSON.parse(resumeData.feedback || "{}")
                : resumeData.feedback || {}
        } catch {
            feedback = {}
        }

        const hasAnalysis =
            resumeData.score !== undefined &&
            (
                Number(resumeData.score) > 0 ||
                resumeData.skills?.length > 0 ||
                resumeData.experience ||
                Object.keys(feedback).length > 0
            )

        if (hasAnalysis) {
            setAnalysis({
                score: resumeData.score || 0,
                skills: resumeData.skills || [],
                experience: resumeData.experience || "",
                strengths: feedback.strengths || [],
                weaknesses: feedback.weaknesses || [],
                suggestions: feedback.suggestions || []
            })

            setCurrentStep(4)
            setFailedStep(0)
        } else {
            setAnalysis(null)
            setCurrentStep(0)
        }
    }

    const loadLatestResume = useCallback(async () => {
        try {
            setFetching(true)

            const token = localStorage.getItem("token")

            const result = await apiCall(
                "/resume/all-resumes",
                "GET",
                null,
                token
            )

            const latestResume = result.resumes?.[0] || null

            if (latestResume) {
                restoreResumeData(latestResume)
            } else {
                setResume(null)
                setAnalysis(null)
                setCurrentStep(0)
                setFailedStep(0)
            }
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setFetching(false)
        }
    }, [])

    useEffect(() => {
        loadLatestResume()
    }, [loadLatestResume])

    const handleDrop = (e) => {
        e.preventDefault()
        setDragActive(false)

        const dropped = e.dataTransfer.files[0]

        if (dropped && dropped.type === "application/pdf") {
            setFile(dropped)
        } else {
            notify("Please drop a PDF file", "error")
        }
    }

    const runPipeline = async (resumeData, startStep = 2) => {
        const token = localStorage.getItem("token")
        let step = startStep

        try {
            if (startStep <= 2) {
                step = 2
                setCurrentStep(2)

                await apiCall(
                    `/resume/extract/${resumeData._id}`,
                    "POST",
                    null,
                    token
                )
            }

            step = 3
            setCurrentStep(3)

            const result = await apiCall(
                `/resume/analyze/${resumeData._id}`,
                "POST",
                null,
                token
            )

            setAnalysis(result.analysis)

            setResume(prev => ({
                ...prev,
                ...resumeData,
                score: result.analysis?.score || 0,
                skills: result.analysis?.skills || [],
                experience: result.analysis?.experience || "",
                feedback: JSON.stringify({
                    strengths: result.analysis?.strengths || [],
                    weaknesses: result.analysis?.weaknesses || [],
                    suggestions: result.analysis?.suggestions || []
                })
            }))

            setCurrentStep(4)
            setFailedStep(0)

            notify(result.message || "Resume uploaded and analyzed successfully")
        } catch (err) {
            setFailedStep(step)
            notify(err.message, "error")
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()

        if (!file) {
            notify("Please select a PDF file", "error")
            return
        }

        const formData = new FormData()
        formData.append("resume", file)

        setLoading(true)
        setMessage("")
        setAnalysis(null)
        setResume(null)
        setFailedStep(0)
        setCurrentStep(1)

        try {
            const token = localStorage.getItem("token")

            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/resume/upload`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || "Upload failed")
            }

            setResume(result.resume)

            await runPipeline(result.resume, 2)
        } catch (err) {
            setFailedStep(1)
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const handleRetry = async () => {
        if (!resume) return

        const startStep = failedStep

        setLoading(true)
        setMessage("")
        setFailedStep(0)

        await runPipeline(resume, startStep)

        setLoading(false)
    }

    const score = Number(analysis?.score) || 0

    const scoreColor =
        score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"

    const scoreText =
        score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"

    const buttonLabel =
        currentStep === 1 ? "Uploading..." : currentStep === 2 ? "Extracting text..." : "Analyzing with AI..."

    return (
        <div className="min-h-screen bg-slate-50">
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
                        <h1 className="text-lg font-bold text-slate-900">Resume Analyzer</h1>
                        <p className="text-xs text-slate-500">
                            Upload once, we extract and analyze it automatically
                        </p>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="mx-auto max-w-2xl">
                        <Stepper currentStep={currentStep} failedStep={failedStep} />

                        <div className="mt-5 min-h-[24px] text-center">
                            <AnimatePresence mode="wait">
                                {loading && stepText[currentStep] && (
                                    <motion.p
                                        key={currentStep}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="text-sm font-medium text-indigo-600"
                                    >
                                        {stepText[currentStep]}
                                    </motion.p>
                                )}

                                {!loading && currentStep === 0 && (
                                    <motion.p
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm text-slate-500"
                                    >
                                        Upload your PDF resume to get started.
                                    </motion.p>
                                )}

                                {!loading && currentStep === 4 && (
                                    <motion.p
                                        key="done"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-medium text-emerald-600"
                                    >
                                        All done! Your analysis is ready.
                                    </motion.p>
                                )}

                                {!loading && failedStep > 0 && (
                                    <motion.p
                                        key="failed"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-medium text-rose-600"
                                    >
                                        Something went wrong at "{steps[failedStep - 1].label}".
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-6 lg:col-span-2"
                    >
                        <motion.form
                            variants={item}
                            onSubmit={handleUpload}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <FiUploadCloud />
                                </span>
                                Upload your resume
                            </h2>

                            <label
                                htmlFor="resume-file"
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setDragActive(true)
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                                    loading || fetching ? "pointer-events-none opacity-60" : ""
                                } ${
                                    dragActive
                                        ? "border-indigo-600 bg-indigo-50"
                                        : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50"
                                }`}
                            >
                                <motion.div
                                    animate={{ y: dragActive ? -4 : 0 }}
                                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600"
                                >
                                    <FiUploadCloud />
                                </motion.div>

                                {file ? (
                                    <>
                                        <p className="max-w-full truncate text-sm font-medium text-slate-900">
                                            {file.name}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Click to choose a different file
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-slate-900">
                                            Click to browse or drag a PDF here
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">PDF files only</p>
                                    </>
                                )}

                                <input
                                    id="resume-file"
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>

                            <motion.button
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.97 }}
                                type="submit"
                                disabled={loading || fetching}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className="animate-spin" /> {buttonLabel}
                                    </>
                                ) : (
                                    <>
                                        <FiZap /> Upload &amp; Analyze
                                    </>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {!loading && resume && failedStep > 1 && (
                                    <motion.button
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        type="button"
                                        onClick={handleRetry}
                                        className="mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-indigo-600 bg-white px-4 py-3 font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                                    >
                                        <FiRefreshCw /> Retry "{steps[failedStep - 1].label}"
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {resume && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg text-indigo-600 shadow-sm">
                                                <FiFileText />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {resume.fileName}
                                                </p>
                                                <a
                                                    href={resume.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                                >
                                                    View Resume PDF <FiExternalLink />
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.form>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    key={message}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
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
                    </motion.div>

                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {analysis ? (
                                <motion.div
                                    key="analysis"
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="space-y-4"
                                >
                                    <motion.div
                                        variants={item}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                                <FiAward className="text-indigo-600" />
                                                Resume Analysis
                                            </h2>
                                            <p className={`text-3xl font-bold ${scoreText}`}>
                                                {analysis.score}
                                                <span className="text-base font-medium text-slate-500">/100</span>
                                            </p>
                                        </div>

                                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(score, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                className={`h-full rounded-full ${scoreColor}`}
                                            />
                                        </div>
                                    </motion.div>

                                    {analysis.skills?.length > 0 && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiZap className="text-lg text-indigo-600" />
                                                Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {analysis.experience && (
                                        <motion.div
                                            variants={item}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                                                <FiBriefcase className="text-lg text-indigo-600" />
                                                Experience
                                            </h3>
                                            <p className="text-sm leading-relaxed text-slate-500">
                                                {analysis.experience}
                                            </p>
                                        </motion.div>
                                    )}

                                    <ListSection
                                        title="Strengths"
                                        icon={<FiCheckCircle />}
                                        iconClass="text-emerald-600"
                                        dotClass="bg-emerald-600"
                                        items={analysis.strengths}
                                    />

                                    <ListSection
                                        title="Weaknesses"
                                        icon={<FiAlertCircle />}
                                        iconClass="text-rose-600"
                                        dotClass="bg-rose-600"
                                        items={analysis.weaknesses}
                                    />

                                    <ListSection
                                        title="Suggestions"
                                        icon={<FiInfo />}
                                        iconClass="text-amber-600"
                                        dotClass="bg-amber-600"
                                        items={analysis.suggestions}
                                    />
                                </motion.div>
                            ) : loading || fetching ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="h-6 w-40 rounded bg-slate-200" />
                                            <div className="h-8 w-20 rounded bg-slate-200" />
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-100" />
                                    </div>

                                    {[1, 2, 3].map(n => (
                                        <div
                                            key={n}
                                            className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <div className="mb-3 h-5 w-32 rounded bg-slate-200" />
                                            <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                                            <div className="h-4 w-4/5 rounded bg-slate-100" />
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                        <FiCpu />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Your analysis will appear here
                                    </h2>
                                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                                        Upload your resume and we will extract the text and run the AI
                                        analysis for you automatically.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Resume
