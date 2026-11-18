
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    FiArrowLeft,
    FiPlus,
    FiBriefcase,
    FiFileText,
    FiCalendar,
    FiTrash2,
    FiLoader,
    FiInbox,
    FiCheckCircle,
    FiAlertCircle,
    FiSave,
    FiSearch,
    FiUsers,
    FiClock,
    FiAward,
    FiXCircle
} from "react-icons/fi"
import apiCall, {
    createApplication,
    getAllApplications,
    updateApplication,
    deleteApplication
} from "../services/api"

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

const labelClass = "mb-1.5 block text-sm font-medium text-slate-900"

const statuses = ["Saved", "Applied", "Interview", "Offer", "Rejected"]

function ApplicationTracker() {
    const navigate = useNavigate()

    const [jobs, setJobs] = useState([])
    const [resumes, setResumes] = useState([])
    const [applications, setApplications] = useState([])

    const [jobId, setJobId] = useState("")
    const [resumeId, setResumeId] = useState("")
    const [status, setStatus] = useState("Saved")
    const [notes, setNotes] = useState("")

    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("All")

    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [updatingId, setUpdatingId] = useState(null)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")

    const token = localStorage.getItem("token")

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const getData = useCallback(async () => {
        try {
            const [jobResult, resumeResult, applicationResult] =
                await Promise.all([
                    apiCall("/job/all-jobs", "GET", null, token),
                    apiCall("/resume/all-resumes", "GET", null, token),
                    getAllApplications(token)
                ])

            setJobs(jobResult.jobs || [])
            setResumes(resumeResult.resumes || [])
            setApplications(applicationResult.applications || [])
        } catch (err) {
            notify(err.message, "error")
        }
    }, [token])

    useEffect(() => {
        getData()
    }, [getData])

    const handleCreate = async (e) => {
        e.preventDefault()

        if (!jobId || !resumeId) {
            notify("Please select a job and resume", "error")
            return
        }

        try {
            setLoading(true)

            const result = await createApplication({
                jobId,
                resumeId,
                status,
                notes
            }, token)

            if (!result.success) {
                throw new Error(result.message)
            }

            notify("Application added successfully")

            setJobId("")
            setResumeId("")
            setStatus("Saved")
            setNotes("")

            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (id, newStatus) => {
        try {
            setUpdatingId(id)

            const result = await updateApplication(
                id,
                { status: newStatus },
                token
            )

            if (!result.success) {
                throw new Error(result.message)
            }

            notify("Application status updated")
            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleNotesUpdate = async (application) => {
        try {
            setUpdatingId(application._id)

            const result = await updateApplication(
                application._id,
                { notes: application.notes || "" },
                token
            )

            if (!result.success) {
                throw new Error(result.message)
            }

            notify("Notes updated successfully")
            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleNotesChange = (id, value) => {
        setApplications(prev =>
            prev.map(application =>
                application._id === id
                    ? { ...application, notes: value }
                    : application
            )
        )
    }

    const handleDelete = async (id) => {
        try {
            setDeletingId(id)

            const result = await deleteApplication(id, token)

            if (!result.success) {
                throw new Error(result.message)
            }

            notify("Application deleted successfully")
            await getData()
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setDeletingId(null)
        }
    }

    const getStatusStyle = (value) => {
        const styles = {
            Saved: "bg-slate-100 text-slate-600",
            Applied: "bg-blue-50 text-blue-600",
            Interview: "bg-amber-50 text-amber-600",
            Offer: "bg-emerald-50 text-emerald-600",
            Rejected: "bg-rose-50 text-rose-600"
        }

        return styles[value] || styles.Saved
    }

    const totalApplications = applications.length
    const appliedCount = applications.filter(app => app.status === "Applied").length
    const interviewCount = applications.filter(app => app.status === "Interview").length
    const offerCount = applications.filter(app => app.status === "Offer").length
    const rejectedCount = applications.filter(app => app.status === "Rejected").length

    const filteredApplications = applications.filter(application => {
        const jobTitle = application.jobId?.jobTitle || ""
        const companyName = application.jobId?.companyName || ""

        const matchesSearch =
            jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            companyName.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            filterStatus === "All" || application.status === filterStatus

        return matchesSearch && matchesStatus
    })

    const summaryCards = [
        {
            title: "Total Applications",
            count: totalApplications,
            icon: <FiUsers />,
            style: "bg-indigo-50 text-indigo-600"
        },
        {
            title: "Applied",
            count: appliedCount,
            icon: <FiBriefcase />,
            style: "bg-blue-50 text-blue-600"
        },
        {
            title: "Interviews",
            count: interviewCount,
            icon: <FiClock />,
            style: "bg-amber-50 text-amber-600"
        },
        {
            title: "Offers",
            count: offerCount,
            icon: <FiAward />,
            style: "bg-emerald-50 text-emerald-600"
        },
        {
            title: "Rejected",
            count: rejectedCount,
            icon: <FiXCircle />,
            style: "bg-rose-50 text-rose-600"
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            <motion.header
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                        >
                            <FiArrowLeft />
                        </button>

                        <div>
                            <h1 className="text-lg font-bold text-slate-900">
                                Application Tracker
                            </h1>
                            <p className="text-xs text-slate-500">
                                Track your job application progress
                            </p>
                        </div>
                    </div>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
                        {applications.length} Applications
                    </span>
                </div>
            </motion.header>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {summaryCards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {card.title}
                                    </p>
                                    <h3 className="mt-2 text-3xl font-bold text-slate-900">
                                        {card.count}
                                    </h3>
                                </div>

                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.style}`}>
                                    {card.icon}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <motion.form
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCreate}
                        className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:col-span-2"
                    >
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FiPlus />
                            </span>
                            Add Application
                        </h2>

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
                                    Application Status
                                </label>

                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className={inputClass}
                                >
                                    {statuses.map(value => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Notes
                                </label>

                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Add application or interview notes..."
                                    rows="4"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <FiPlus />
                                    Add Application
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
                    </motion.form>

                    <section className="lg:col-span-3">
                        <h2 className="mb-4 text-xl font-semibold text-slate-900">
                            Your Applications
                        </h2>

                        <div className="mb-5 grid gap-3 sm:grid-cols-2">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search job or company..."
                                    className={`${inputClass} pl-10`}
                                />
                            </div>

                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className={inputClass}
                            >
                                <option value="All">All Statuses</option>
                                {statuses.map(value => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="mb-4 text-sm text-slate-500">
                            Showing {filteredApplications.length} of {totalApplications} applications
                        </p>

                        <div className="grid gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredApplications.map(application => (
                                    <motion.div
                                        key={application._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {application.jobId?.jobTitle || "Job"}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {application.jobId?.companyName || ""}
                                                </p>
                                            </div>

                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(application.status)}`}>
                                                {application.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm text-slate-500">
                                            <p className="flex items-center gap-2">
                                                <FiFileText className="text-indigo-600" />
                                                {application.resumeId?.fileName || "Resume"}
                                            </p>

                                            <p className="flex items-center gap-2">
                                                <FiCalendar className="text-indigo-600" />
                                                {application.appliedDate
                                                    ? new Date(application.appliedDate).toLocaleDateString()
                                                    : "Not applied yet"
                                                }
                                            </p>
                                        </div>

                                        <div className="mt-5">
                                            <label className={labelClass}>
                                                Update Status
                                            </label>

                                            <select
                                                value={application.status}
                                                onChange={e => handleStatusChange(application._id, e.target.value)}
                                                disabled={updatingId === application._id}
                                                className={inputClass}
                                            >
                                                {statuses.map(value => (
                                                    <option key={value} value={value}>
                                                        {value}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label className={labelClass}>
                                                Application Notes
                                            </label>

                                            <textarea
                                                rows="3"
                                                value={application.notes || ""}
                                                onChange={e => handleNotesChange(application._id, e.target.value)}
                                                placeholder="Add interview details or notes..."
                                                className={inputClass}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => handleNotesUpdate(application)}
                                                disabled={updatingId === application._id}
                                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white disabled:opacity-50"
                                            >
                                                {updatingId === application._id
                                                    ? <FiLoader className="animate-spin" />
                                                    : <FiSave />
                                                }
                                                Save Notes
                                            </button>
                                        </div>

                                        <div className="mt-5 border-t border-slate-200 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(application._id)}
                                                disabled={deletingId === application._id}
                                                className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-600 hover:text-white disabled:opacity-50"
                                            >
                                                {deletingId === application._id
                                                    ? <FiLoader className="animate-spin" />
                                                    : <FiTrash2 />
                                                }
                                                Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredApplications.length === 0 && (
                                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
                                        <FiInbox />
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {applications.length === 0
                                            ? "No applications available"
                                            : "No matching applications"
                                        }
                                    </h3>

                                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                                        {applications.length === 0
                                            ? "Add your first job application using the form."
                                            : "Try changing your search term or status filter."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default ApplicationTracker
