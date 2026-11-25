import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
    FiArrowLeft,
    FiBriefcase,
    FiLoader,
    FiMessageSquare,
    FiCheckCircle,
    FiAlertCircle,
    FiHelpCircle,
    FiPlay,
    FiChevronLeft,
    FiChevronRight,
    FiSend
} from "react-icons/fi"
import apiCall, { createInterview, evaluateAnswer } from "../services/api"

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"

const labelClass = "mb-1.5 block text-sm font-medium text-slate-900"

const interviewTypes = ["Technical", "HR", "Behavioral", "Mixed"]

function InterviewPreparation() {
    const navigate = useNavigate()

    const [jobs, setJobs] = useState([])
    const [jobId, setJobId] = useState("")
    const [selectedSkills, setSelectedSkills] = useState([])
    const [interviewType, setInterviewType] = useState("Mixed")
    const [interview, setInterview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")

    const [isMockInterview, setIsMockInterview] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState([])
    const [isCompleted, setIsCompleted] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const [evaluations, setEvaluations] = useState([])

    const token = localStorage.getItem("token")

    const questions = interview?.questions || []
    const currentQuestion = questions[currentQuestionIndex]
    const selectedJob = jobs.find(job => job._id === jobId)
    const availableSkills = selectedJob?.requiredSkills || []

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const getData = useCallback(async () => {
        try {
            setFetching(true)
            const jobResult = await apiCall("/job/all-jobs", "GET", null, token)
            setJobs(jobResult.jobs || [])
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setFetching(false)
        }
    }, [token])


    useEffect(() => {
        getData()
    }, [getData])


    const handleJobChange = (value) => {
        setJobId(value)
        setSelectedSkills([])
        setInterview(null)
        setIsMockInterview(false)
        setIsCompleted(false)
        setAnswers([])
        setEvaluations([])
        setMessage("")
    }


    const handleSkillToggle = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(item => item !== skill)
                : [...prev, skill]
        )
    }


    const handleGenerate = async (e) => {
        e.preventDefault()

        if (!jobId) {
            notify("Please select a job", "error")
            return
        }

        if (!selectedSkills.length) {
            notify("Please select at least one skill", "error")
            return
        }

        try {
            setLoading(true)
            setInterview(null)
            setIsMockInterview(false)
            setIsCompleted(false)
            setAnswers([])
            setMessage("")
            setEvaluations([])

            const result = await createInterview({
                jobId,
                skills: selectedSkills,
                interviewType
            }, token)

            if (!result.interview) {
                throw new Error(result.message || "Unable to generate questions")
            }

            setInterview(result.interview)
            setAnswers(new Array(result.interview.questions?.length || 0).fill(""))
            notify("Interview questions generated successfully")
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }


    const handleStartMockInterview = () => {
        setCurrentQuestionIndex(0)
        setIsMockInterview(true)
        setIsCompleted(false)
        setMessage("")
    }


    const handleAnswerChange = (value) => {
        setAnswers(prev => {
            const updated = [...prev]
            updated[currentQuestionIndex] = value
            return updated
        })
    }


    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }


    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }


    const handleFinishInterview = async () => {
        try {
            setEvaluating(true)
            setMessage("")
            setEvaluations([])

            const results = []

            for (let index = 0; index < questions.length; index++) {
                const result = await evaluateAnswer({
                    interviewId: interview._id,
                    questionIndex: index,
                    userAnswer: answers[index] || ""
                }, token)

                if (result.score === undefined) {
                    throw new Error(result.message || `Failed to evaluate question ${index + 1}`)
                }

                results.push({
                    question: questions[index].question,
                    category: questions[index].category,
                    userAnswer: answers[index] || "",
                    score: result.score,
                    feedback: result.feedback,
                    suggestions: result.suggestions || []
                })

                setEvaluations([...results])
            }

            setIsCompleted(true)
            notify("Interview evaluated successfully")
        } catch (err) {
            notify(err.message, "error")
        } finally {
            setEvaluating(false)
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
                                        onChange={e => handleJobChange(e.target.value)}
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
                                        Select Skills to Practice
                                    </label>

                                    {!jobId ? (
                                        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                                            Select a job first to view its required skills.
                                        </p>
                                    ) : availableSkills.length === 0 ? (
                                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-600">
                                            No required skills found for this job.
                                        </p>
                                    ) : (
                                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-xs text-slate-500">
                                                    Select the skills you want to practice
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedSkills(
                                                        selectedSkills.length === availableSkills.length
                                                            ? []
                                                            : [...availableSkills]
                                                    )}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                                >
                                                    {selectedSkills.length === availableSkills.length
                                                        ? "Clear All"
                                                        : "Select All"}
                                                </button>
                                            </div>

                                            {availableSkills.map((skill, index) => (
                                                <label
                                                    key={`${skill}-${index}`}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${selectedSkills.includes(skill)
                                                            ? "border-indigo-300 bg-indigo-50"
                                                            : "border-slate-200 bg-white hover:border-indigo-200"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSkills.includes(skill)}
                                                        onChange={() => handleSkillToggle(skill)}
                                                        className="h-4 w-4 rounded accent-indigo-600"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {skill}
                                                    </span>
                                                </label>
                                            ))}

                                            <p className="pt-1 text-xs text-slate-500">
                                                {selectedSkills.length} of {availableSkills.length} skills selected
                                            </p>
                                        </div>
                                    )}
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
                            disabled={loading || fetching || !jobs.length || !selectedSkills.length}
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
                            <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${messageType === "error"
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


                        {!fetching && !jobs.length && (
                            <p className="mt-4 text-sm text-slate-500">
                                Add a job with required skills in Job Management before generating interview questions.
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
                                    Select a job, choose the skills you want to practice, and generate personalized interview questions.
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
                                        {questions.length} Questions Generated
                                    </p>
                                </div>


                                {!isMockInterview && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleStartMockInterview}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
                                        >
                                            <FiPlay />
                                            Start Mock Interview
                                        </button>


                                        {questions.map((item, index) => (
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
                                    </>
                                )}


                                {isMockInterview && !isCompleted && currentQuestion && (
                                    <motion.div
                                        key={currentQuestionIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="mb-6 flex items-center justify-between">
                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                                {currentQuestion.category}
                                            </span>
                                            <span className="text-sm font-medium text-slate-500">
                                                Question {currentQuestionIndex + 1} of {questions.length}
                                            </span>
                                        </div>

                                        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-600 transition-all"
                                                style={{
                                                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                                                }}
                                            />
                                        </div>

                                        <h3 className="text-lg font-semibold leading-7 text-slate-900">
                                            {currentQuestion.question}
                                        </h3>

                                        <div className="mt-6">
                                            <label className={labelClass}>
                                                Your Answer
                                            </label>
                                            <textarea
                                                value={answers[currentQuestionIndex] || ""}
                                                onChange={e => handleAnswerChange(e.target.value)}
                                                placeholder="Type your answer here..."
                                                rows={7}
                                                className={inputClass}
                                            />
                                            <p className="mt-2 text-xs text-slate-400">
                                                Your answer will be evaluated by AI in the next step.
                                            </p>
                                        </div>

                                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={handlePrevious}
                                                disabled={currentQuestionIndex === 0}
                                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <FiChevronLeft />
                                                Previous
                                            </button>

                                            {currentQuestionIndex < questions.length - 1 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                                                >
                                                    Next
                                                    <FiChevronRight />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleFinishInterview}
                                                    disabled={evaluating}
                                                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {evaluating ? (
                                                        <>
                                                            <FiLoader className="animate-spin" />
                                                            Evaluating Answers...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiSend />
                                                            Finish Interview
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}


                                {isMockInterview && isCompleted && (
                                    <div className="space-y-5">
                                        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
                                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                                                <FiCheckCircle />
                                            </div>
                                            <h3 className="text-xl font-semibold text-slate-900">
                                                Interview Completed!
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-500">
                                                You answered {answers.filter(answer => answer.trim()).length} out of {questions.length} questions.
                                            </p>

                                            <div className="mt-6">
                                                <p className="text-sm font-medium text-slate-500">
                                                    Overall Interview Score
                                                </p>
                                                <h2 className="mt-2 text-4xl font-bold text-indigo-600">
                                                    {evaluations.length
                                                        ? Math.round(evaluations.reduce((total, item) => total + Number(item.score), 0) / evaluations.length)
                                                        : 0}/100
                                                </h2>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsMockInterview(false)
                                                    setIsCompleted(false)
                                                }}
                                                className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                                            >
                                                Review Questions
                                            </button>
                                        </div>


                                        {evaluations.map((item, index) => (
                                            <div
                                                key={index}
                                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-semibold text-slate-500">
                                                        Question {index + 1}
                                                    </span>
                                                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${item.score >= 75
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : item.score >= 50
                                                                ? "bg-amber-50 text-amber-600"
                                                                : "bg-rose-50 text-rose-600"
                                                        }`}>
                                                        {item.score}/100
                                                    </span>
                                                </div>

                                                <h3 className="mt-3 font-semibold text-slate-900">
                                                    {item.question}
                                                </h3>

                                                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                                    <p className="mb-2 text-sm font-semibold text-slate-700">
                                                        Your Answer
                                                    </p>
                                                    <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                                                        {item.userAnswer || "No answer provided"}
                                                    </p>
                                                </div>

                                                <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                                                    <p className="mb-2 text-sm font-semibold text-indigo-700">
                                                        AI Feedback
                                                    </p>
                                                    <p className="text-sm leading-6 text-slate-700">
                                                        {item.feedback}
                                                    </p>
                                                </div>

                                                {item.suggestions.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="mb-2 text-sm font-semibold text-slate-900">
                                                            Improvement Suggestions
                                                        </p>
                                                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                                                            {item.suggestions.map((suggestion, suggestionIndex) => (
                                                                <li key={suggestionIndex}>
                                                                    {suggestion}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}


export default InterviewPreparation
