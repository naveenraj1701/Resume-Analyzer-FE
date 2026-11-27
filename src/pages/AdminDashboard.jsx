
import { useCallback, useEffect, useState } from "react"
import {
    FiActivity,
    FiBriefcase,
    FiFileText,
    FiUsers,
    FiGrid,
    FiSearch,
    FiRefreshCw,
    FiTrash2,
    FiChevronLeft,
    FiChevronRight,
    FiShield,
    FiAward,
    FiLogOut,
    FiMenu,
    FiX,
    FiTrendingUp,
    FiPlus,
    FiZap,
    FiLoader,
    FiLink,
    FiCheckCircle,
    FiAlertCircle
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import apiCall, { extractJobFromURL } from "../services/api"

const menuItems = [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "users", label: "Users", icon: FiUsers },
    { id: "jobs", label: "Jobs", icon: FiBriefcase },
    { id: "resumes", label: "Resumes", icon: FiFileText },
    { id: "applications", label: "Applications", icon: FiActivity }
]

const pageConfig = {
    users: {
        endpoint: "/admin/all-users",
        key: "users",
        deleteEndpoint: "/admin/delete-user/",
        title: "Users",
        searchPlaceholder: "Search by name or email"
    },
    jobs: {
        endpoint: "/admin/all-jobs",
        key: "jobs",
        deleteEndpoint: "/admin/delete-job/",
        title: "Jobs",
        searchPlaceholder: "Search by job title or company"
    },
    resumes: {
        endpoint: "/admin/all-resumes",
        key: "resumes",
        deleteEndpoint: "/admin/delete-resume/",
        title: "Resumes",
        searchPlaceholder: "Search by file name"
    },
    applications: {
        endpoint: "/admin/all-applications",
        key: "applications",
        deleteEndpoint: "/admin/delete-application/",
        title: "Applications",
        searchPlaceholder: "Search applications"
    }
}

const emptyJobForm = {
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    requiredSkills: "",
    location: "",
    jobType: "Full-time"
}

const jobTypes = ["Full-time", "Part-time", "Internship", "Remote", "Contract"]

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700"

const getPayload = (response) => response?.data || response || {}

const AdminDashboard = () => {
    const navigate = useNavigate()
    const token = localStorage.getItem("token")

    const [activeTab, setActiveTab] = useState("overview")
    const [stats, setStats] = useState({})
    const [records, setRecords] = useState([])
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [jobForm, setJobForm] = useState(emptyJobForm)
    const [jobURL, setJobURL] = useState("")
    const [applyEnabled, setApplyEnabled] = useState(false)
    const [applyLink, setApplyLink] = useState("")
    const [creatingJob, setCreatingJob] = useState(false)
    const [extractingJob, setExtractingJob] = useState(false)
    const [jobMessage, setJobMessage] = useState("")
    const [jobMessageType, setJobMessageType] = useState("success")


    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true)
            setError("")

            const response = await apiCall(
                "/admin/dashboard-stats",
                "GET",
                null,
                token
            )

            const data = response?.data || response || {}

            setStats({
                ...(data.stats || {}),
                recentUsers: data.recentUsers || [],
                recentJobs: data.recentJobs || []
            })
        } catch (err) {
            setError(err.message || "Unable to load dashboard statistics")
        } finally {
            setLoading(false)
        }
    }, [token])


    const loadRecords = useCallback(async () => {
        const config = pageConfig[activeTab]

        if (!config) return

        try {
            setLoading(true)
            setError("")

            let endpoint = `${config.endpoint}?page=${page}&limit=10`

            if (search.trim()) {
                endpoint += `&search=${encodeURIComponent(search.trim())}`
            }

            if (activeTab === "users" && roleFilter) {
                endpoint += `&role=${encodeURIComponent(roleFilter)}`
            }

            const response = await apiCall(endpoint, "GET", null, token)
            const data = getPayload(response)

            setRecords(data[config.key] || [])
            setTotalPages(data.totalPages || 1)
            setTotalRecords(
                data.totalUsers ??
                data.totalJobs ??
                data.totalResumes ??
                data.totalApplications ??
                data.total ??
                0
            )
        } catch (err) {
            setRecords([])
            setError(err.message || `Unable to load ${config.title.toLowerCase()}`)
        } finally {
            setLoading(false)
        }
    }, [activeTab, page, search, roleFilter, token])

    useEffect(() => {
        if (activeTab === "overview") {
            loadDashboard()
        } else {
            loadRecords()
        }
    }, [activeTab, loadDashboard, loadRecords])

    useEffect(() => {
        setPage(1)
    }, [activeTab, search, roleFilter])

    const notifyJob = (message, type = "success") => {
        setJobMessage(message)
        setJobMessageType(type)
    }

    const handleJobChange = (e) => {
        setJobForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleExtractJob = async () => {
        if (!jobURL.trim()) {
            notifyJob("Please enter a job URL", "error")
            return
        }

        try {
            setExtractingJob(true)
            setJobMessage("")

            const result = await extractJobFromURL(jobURL, token)

            if (!result.success) {
                throw new Error(result.message || "Failed to extract job details")
            }

            const details = result.jobDetails

            const formatSection = (title, items) => {
                if (!items || items.length === 0) return ""

                return `${title}:\n${items.map(item => `• ${item}`).join("\n")}`
            }

            const splitItems = (value) => {
                if (!value) return []

                if (Array.isArray(value)) return value.map(String)

                return String(value)
                    .split("\n")
                    .map(item => item.trim().replace(/^[•\-*]\s*/, ""))
                    .filter(Boolean)
            }

            const jobDescription = [
                formatSection("Overview", splitItems(details.jobDescription)),
                formatSection("Responsibilities", splitItems(details.responsibilities)),
                formatSection("Qualifications", splitItems(details.qualifications))
            ]
                .filter(Boolean)
                .join("\n\n")

            const matchedJobType = jobTypes.find(
                type => type.toLowerCase() === details.jobType?.toLowerCase()
            )

            setJobForm({
                jobTitle: details.jobTitle || "",
                companyName: details.companyName || "",
                jobDescription,
                requiredSkills: (details.requiredSkills || []).join(", "),
                location: details.location || "",
                jobType: matchedJobType || "Full-time"
            })

            notifyJob("Job details extracted successfully. Review before creating.")
        } catch (err) {
            notifyJob(err.message, "error")
        } finally {
            setExtractingJob(false)
        }
    }

    const handleCreateJob = async (e) => {
        e.preventDefault()

        if (applyEnabled && !applyLink.trim()) {
            notifyJob("Please enter the application URL", "error")
            return
        }

        if (applyEnabled) {
            try {
                new URL(applyLink.trim())
            } catch {
                notifyJob("Please enter a valid application URL", "error")
                return
            }
        }

        try {
            setCreatingJob(true)
            setJobMessage("")

            const jobData = {
                ...jobForm,
                requiredSkills: jobForm.requiredSkills
                    .split(",")
                    .map(skill => skill.trim())
                    .filter(Boolean),
                applyEnabled,
                applyLink: applyEnabled ? applyLink.trim() : ""
            }

            await apiCall("/job/create-job", "POST", jobData, token)

            setJobForm(emptyJobForm)
            setJobURL("")
            setApplyEnabled(false)
            setApplyLink("")

            notifyJob("Job created successfully")

            await loadRecords()
            await loadDashboard()
        } catch (err) {
            notifyJob(err.message || "Unable to create job", "error")
        } finally {
            setCreatingJob(false)
        }
    }

    const handleDelete = async (id, label) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete this ${label}?`
        )

        if (!confirmed) return

        try {
            const config = pageConfig[activeTab]

            await apiCall(
                `${config.deleteEndpoint}${id}`,
                "DELETE",
                null,
                token
            )

            await loadRecords()

            if (activeTab === "jobs") {
                await loadDashboard()
            }
        } catch (err) {
            window.alert(err.message || `Unable to delete ${label}`)
        }
    }

    const handleRoleChange = async (userId, role) => {
        try {
            await apiCall(
                `/admin/update-user-role/${userId}`,
                "PUT",
                { role },
                token
            )

            await loadRecords()
        } catch (err) {
            window.alert(err.message || "Unable to update user role")
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        navigate("/")
    }

    const changeTab = (tab) => {
        setActiveTab(tab)
        setSearch("")
        setRoleFilter("")
        setPage(1)
        setSidebarOpen(false)
        setError("")
        setJobMessage("")
    }

    const refreshData = () => {
        if (activeTab === "overview") {
            loadDashboard()
        } else {
            loadRecords()
        }
    }

    const statCards = [
        {
            label: "Total Users",
            value: stats.totalUsers ?? 0,
            icon: FiUsers,
            color: "bg-blue-50 text-blue-600"
        },
        {
            label: "Total Admins",
            value: stats.totalAdmins ?? 0,
            icon: FiShield,
            color: "bg-purple-50 text-purple-600"
        },
        {
            label: "Premium Users",
            value: stats.totalPremiumUsers ?? 0,
            icon: FiAward,
            color: "bg-amber-50 text-amber-600"
        },
        {
            label: "Total Jobs",
            value: stats.totalJobs ?? 0,
            icon: FiBriefcase,
            color: "bg-green-50 text-green-600"
        },
        {
            label: "Total Resumes",
            value: stats.totalResumes ?? 0,
            icon: FiFileText,
            color: "bg-pink-50 text-pink-600"
        },
        {
            label: "Applications",
            value: stats.totalApplications ?? 0,
            icon: FiActivity,
            color: "bg-indigo-50 text-indigo-600"
        }
    ]

    const renderOverview = () => (
        <div className="space-y-7">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Dashboard Overview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Monitor your AI Resume Analyzer platform.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {statCards.map(item => {
                    const Icon = item.icon

                    return (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {item.label}
                                    </p>
                                    <h3 className="mt-3 text-3xl font-bold text-gray-900">
                                        {item.value}
                                    </h3>
                                </div>

                                <div className={`rounded-xl p-3 ${item.color}`}>
                                    <Icon size={22} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Users</h3>
                        <button
                            onClick={() => changeTab("users")}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(stats.recentUsers || []).length > 0 ? (
                            stats.recentUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-800">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {user.email}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                                        {user.role}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">No recent users found.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Jobs</h3>
                        <button
                            onClick={() => changeTab("jobs")}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(stats.recentJobs || []).length > 0 ? (
                            stats.recentJobs.map(job => (
                                <div
                                    key={job._id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-800">
                                            {job.jobTitle}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {job.companyName}
                                        </p>
                                    </div>

                                    <span className="text-xs text-gray-400">
                                        {job.location || "Location not specified"}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">No recent jobs found.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                        <FiTrendingUp size={22} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Average Resume Score</p>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {Number(stats.averageResumeScore || 0).toFixed(1)}%
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderJobForm = () => (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <FiPlus size={20} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Create New Job
                    </h3>
                    <p className="text-xs text-gray-500">
                        Add a new opportunity to your job board
                    </p>
                </div>
            </div>

            <div className="mb-6 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        <FiZap size={20} />
                    </div>

                    <div>
                        <h4 className="font-semibold">Import with AI</h4>
                        <p className="text-xs text-teal-100">
                            Paste a job URL to extract job details
                        </p>
                    </div>
                </div>

                <div className="relative mt-4">
                    <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input
                        type="url"
                        placeholder="https://company.com/careers/job"
                        value={jobURL}
                        onChange={e => setJobURL(e.target.value)}
                        className="w-full rounded-lg border-0 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleExtractJob}
                    disabled={extractingJob || !jobURL.trim()}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {extractingJob ? (
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
                </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                    <label className={labelClass}>Job Title</label>
                    <input
                        name="jobTitle"
                        value={jobForm.jobTitle}
                        onChange={handleJobChange}
                        placeholder="Frontend Developer"
                        className={inputClass}
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Company Name</label>
                    <input
                        name="companyName"
                        value={jobForm.companyName}
                        onChange={handleJobChange}
                        placeholder="Acme Technologies"
                        className={inputClass}
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Job Description</label>
                    <textarea
                        name="jobDescription"
                        value={jobForm.jobDescription}
                        onChange={handleJobChange}
                        placeholder={"• Write one point per line\n• Add headings ending with a colon"}
                        className={`${inputClass} leading-relaxed`}
                        rows="7"
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Required Skills</label>
                    <input
                        name="requiredSkills"
                        value={jobForm.requiredSkills}
                        onChange={handleJobChange}
                        placeholder="JavaScript, React, Node.js"
                        className={inputClass}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        Separate skills with commas
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Apply Now button
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Enable only when an external application link is available.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setApplyEnabled(prev => !prev)
                                if (applyEnabled) setApplyLink("")
                            }}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${applyEnabled
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-gray-500 hover:bg-gray-600"
                                }`}
                        >
                            {applyEnabled ? "Enabled" : "Disabled"}
                        </button>
                    </div>

                    {applyEnabled && (
                        <div className="mt-4">
                            <label className={labelClass}>Application URL</label>
                            <input
                                type="url"
                                value={applyLink}
                                onChange={e => setApplyLink(e.target.value)}
                                placeholder="https://company.com/careers/apply"
                                className={inputClass}
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Location</label>
                        <input
                            name="location"
                            value={jobForm.location}
                            onChange={handleJobChange}
                            placeholder="Chennai"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Job Type</label>
                        <select
                            name="jobType"
                            value={jobForm.jobType}
                            onChange={handleJobChange}
                            className={inputClass}
                        >
                            {jobTypes.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={creatingJob}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {creatingJob ? (
                        <>
                            <FiLoader className="animate-spin" />
                            Creating Job...
                        </>
                    ) : (
                        <>
                            <FiPlus />
                            Create Job
                        </>
                    )}
                </button>

                {jobMessage && (
                    <div
                        className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${jobMessageType === "error"
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {jobMessageType === "error" ? (
                            <FiAlertCircle className="mt-0.5 shrink-0" />
                        ) : (
                            <FiCheckCircle className="mt-0.5 shrink-0" />
                        )}
                        <p>{jobMessage}</p>
                    </div>
                )}
            </form>
        </div>
    )

    const renderTable = () => {
        const config = pageConfig[activeTab]

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Manage {config.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Search, review and manage platform {config.title.toLowerCase()}.
                    </p>
                </div>

                {activeTab === "jobs" && renderJobForm()}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <FiSearch
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={config.searchPlaceholder}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                    </div>

                    {activeTab === "users" && (
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
                        >
                            <option value="">All Roles</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    )}

                    <button
                        onClick={refreshData}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        <FiRefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h3 className="font-semibold text-gray-800">
                            All {config.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                            {totalRecords} records
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center">
                            <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-sm text-red-500">
                            {error}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="font-medium text-gray-700">No records found</p>
                            <p className="mt-1 text-sm text-gray-400">
                                Try changing your search.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[750px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    {activeTab === "users" && (
                                        <tr>
                                            <th className="px-5 py-4">User</th>
                                            <th className="px-5 py-4">Role</th>
                                            <th className="px-5 py-4">Premium</th>
                                            <th className="px-5 py-4">Joined</th>
                                            <th className="px-5 py-4">Action</th>
                                        </tr>
                                    )}

                                    {activeTab === "jobs" && (
                                        <tr>
                                            <th className="px-5 py-4">Job</th>
                                            <th className="px-5 py-4">Company</th>
                                            <th className="px-5 py-4">Location</th>
                                            <th className="px-5 py-4">Job Type</th>
                                            <th className="px-5 py-4">Action</th>
                                        </tr>
                                    )}

                                    {activeTab === "resumes" && (
                                        <tr>
                                            <th className="px-5 py-4">Resume</th>
                                            <th className="px-5 py-4">Uploaded By</th>
                                            <th className="px-5 py-4">Score</th>
                                            <th className="px-5 py-4">Uploaded</th>
                                            <th className="px-5 py-4">Action</th>
                                        </tr>
                                    )}

                                    {activeTab === "applications" && (
                                        <tr>
                                            <th className="px-5 py-4">Applicant</th>
                                            <th className="px-5 py-4">Job</th>
                                            <th className="px-5 py-4">Company</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Action</th>
                                        </tr>
                                    )}
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {records.map(item => (
                                        <tr
                                            key={item._id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            {activeTab === "users" && (
                                                <>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-gray-800">
                                                            {item.name || "Unknown"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {item.email}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <select
                                                            value={item.role || "user"}
                                                            onChange={e => handleRoleChange(item._id, e.target.value)}
                                                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs capitalize outline-none focus:border-teal-500"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className={`rounded-full px-3 py-1 text-xs ${item.isPremium
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-gray-100 text-gray-500"
                                                            }`}>
                                                            {item.isPremium ? "Premium" : "Free"}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-500">
                                                        {item.createdAt
                                                            ? new Date(item.createdAt).toLocaleDateString()
                                                            : "-"}
                                                    </td>
                                                </>
                                            )}

                                            {activeTab === "jobs" && (
                                                <>
                                                    <td className="px-5 py-4 font-medium text-gray-800">
                                                        {item.jobTitle || "-"}
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600">
                                                        {item.companyName || "-"}
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600">
                                                        {item.location || "-"}
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600">
                                                        {item.jobType || "-"}
                                                    </td>
                                                </>
                                            )}

                                            {activeTab === "resumes" && (
                                                <>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-gray-800">
                                                            {item.fileName || "Resume"}
                                                        </p>
                                                        {item.fileUrl && (
                                                            <a
                                                                href={item.fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-1 inline-block text-xs text-teal-600 hover:underline"
                                                            >
                                                                View resume
                                                            </a>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-gray-700">
                                                            {item.userId?.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.userId?.email || ""}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 font-medium text-gray-700">
                                                        {item.score ?? 0}%
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-500">
                                                        {item.createdAt
                                                            ? new Date(item.createdAt).toLocaleDateString()
                                                            : "-"}
                                                    </td>
                                                </>
                                            )}

                                            {activeTab === "applications" && (
                                                <>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-gray-800">
                                                            {item.userId?.name || "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.userId?.email || ""}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-700">
                                                        {item.jobId?.jobTitle || "-"}
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-600">
                                                        {item.jobId?.companyName || "-"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs capitalize text-blue-700">
                                                            {item.status || "Applied"}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleDelete(
                                                        item._id,
                                                        config.title.slice(0, -1).toLowerCase()
                                                    )}
                                                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={17} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
                        <p className="text-xs text-gray-500">
                            Page {page} of {totalPages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() => setPage(current => current - 1)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <FiChevronLeft size={17} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-medium text-gray-700">
                                {page}
                            </span>

                            <button
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(current => current + 1)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <FiChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    aria-label="Close sidebar"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            Resume<span className="text-teal-600">AI</span>
                        </h1>
                        <p className="mt-0.5 text-xs text-gray-400">Admin Panel</p>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-gray-500 lg:hidden"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                <div className="px-4 py-6">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Menu
                    </p>

                    <nav className="space-y-1">
                        {menuItems.map(item => {
                            const Icon = item.icon

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => changeTab(item.id)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${activeTab === item.id
                                            ? "bg-teal-50 text-teal-700"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={19} />
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                <div className="mt-auto border-t border-gray-100 p-4">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                            <FiShield size={19} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Administrator
                            </p>
                            <p className="text-xs text-gray-500">Admin account</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                        <FiLogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-64">
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/90 px-4 backdrop-blur sm:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <FiMenu size={22} />
                        </button>

                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Admin Dashboard
                            </p>
                            <p className="text-xs text-gray-400">
                                Manage your platform
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={refreshData}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                    >
                        <FiRefreshCw size={15} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </header>

                <main className="p-4 sm:p-8">
                    {error && activeTab === "overview" && (
                        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {activeTab === "overview"
                        ? renderOverview()
                        : renderTable()}
                </main>
            </div>
        </div>
    )
}

export default AdminDashboard
