
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
    FiArrowLeft,
    FiBriefcase,
    FiFileText,
    FiLoader,
    FiMessageSquare,
    FiCheckCircle,
    FiAlertCircle,
    FiHelpCircle
} from "react-icons/fi"
import apiCall, { createInterview } from "../services/api"

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

const labelClass = "mb-1.5 block text-sm font-medium text-slate-900"

const interviewTypes = ["Technical", "HR", "Behavioral", "Mixed"]

function InterviewPreparation() {
    const navigate = useNavigate()

    const [jobs, setJobs] = useState([])
    const [resumes, setResumes] = useState([])
    const [jobId, setJobId] = useState("")
    const [resumeId, setResumeId] = useState("")
    const [interviewType, setInterviewType] = useState("Mixed")
    const [interview, setInterview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")

    const token = localStorage.getItem("token")

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const getData = useCallback(async () => {
        try {
            setFetching(true)

            const [jobResult, resumeResult] = await Promise.all([
                apiCall("/job/all-jobs", "GET", null, token),
                apiCall("/resume/all-resumes", "GET", null, token)
            ])

            setJobs(jobResult.jobs || [])
            setResumes(resumeResult.resumes || [])
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setFetching(false)
        }
    }, [token])

    useEffect(() => {
        getData()
    }, [getData])

    const handleGenerate = async (e) => {
        e.preventDefault()

        if (!jobId || !resumeId) {
            notify("Please select a job and resume", "error")
            return
        }

        try {
            setLoading(true)
            setInterview(null)
            setMessage("")

            const result = await createInterview({
                resumeId,
                jobId,
                interviewType
            }, token)

            if (!result.interview) {
                throw new Error(result.message || "Unable to generate questions")
            }

            setInterview(result.interview)
            notify("Interview questions generated successfully")
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <motion.header
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur"
            >
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    >
                        <FiArrowLeft />
                    </button>

                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            AI Interview Preparation
                        </h1>
                        <p className="text-xs text-slate-500">
                            Prepare for interviews with personalized AI questions
                        </p>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="grid gap-6 lg:grid-cols-5">
                    <motion.form
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleGenerate}
                        className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
                    >
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FiMessageSquare />
                            </span>
                            Generate Questions
                        </h2>

                        {fetching ? (
                            <div className="flex items-center justify-center py-10 text-indigo-600">
                                <FiLoader className="animate-spin text-xl" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>
                                        <FiBriefcase className="mr-1 inline text-indigo-600" />
                                        Select Job
                                    </label>

                                    <select
                                        value={jobId}
                                        onChange={e => setJobId(e.target.value)}
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

                                <div>
                                    <label className={labelClass}>
                                        <FiFileText className="mr-1 inline text-indigo-600" />
                                        Select Resume
                                    </label>

                                    <select
                                        value={resumeId}
                                        onChange={e => setResumeId(e.target.value)}
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
                                        Interview Type
                                    </label>

                                    <select
                                        value={interviewType}
                                        onChange={e => setInterviewType(e.target.value)}
                                        className={inputClass}
                                    >
                                        {interviewTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || fetching || !jobs.length || !resumes.length}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    Generating Questions...
                                </>
                            ) : (
                                <>
                                    <FiMessageSquare />
                                    Generate Interview Questions
                                </>
                            )}
                        </button>

                        {message && (
                            <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                                messageType === "error"
                                    ? "border-rose-200 bg-rose-50 text-rose-600"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-600"
                            }`}>
                                {messageType === "error"
                                    ? <FiAlertCircle />
                                    : <FiCheckCircle />
                                }
                                {message}
                            </div>
                        )}

                        {!fetching && (!jobs.length || !resumes.length) && (
                            <p className="mt-4 text-sm text-slate-500">
                                {!jobs.length
                                    ? "Add a job in Job Management before generating questions."
                                    : "Upload a resume before generating questions."
                                }
                            </p>
                        )}
                    </motion.form>

                    <section className="lg:col-span-3">
                        <h2 className="mb-4 text-xl font-semibold text-slate-900">
                            Generated Interview Questions
                        </h2>

                        {!interview && (
                            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                    <FiHelpCircle />
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900">
                                    No Questions Generated
                                </h3>

                                <p className="mt-2 max-w-sm text-sm text-slate-500">
                                    Select a resume, job, and interview type to generate personalized interview questions.
                                </p>
                            </div>
                        )}

                        {interview && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <p className="text-sm text-slate-500">
                                        Interview Type
                                    </p>
                                    <h3 className="mt-1 font-semibold text-slate-900">
                                        {interview.interviewType}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {interview.questions?.length || 0} Questions Generated
                                    </p>
                                </div>

                                {interview.questions?.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-semibold text-indigo-600">
                                                {index + 1}
                                            </span>

                                            <div className="min-w-0">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                    {item.category}
                                                </span>

                                                <h3 className="mt-3 font-semibold text-slate-900">
                                                    {item.question}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                                            <p className="mb-2 text-sm font-semibold text-indigo-700">
                                                Sample Answer
                                            </p>
                                            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                                                {item.sampleAnswer}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

export default InterviewPreparation
