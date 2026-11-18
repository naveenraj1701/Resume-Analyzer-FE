const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const apiCall = async (endpoint, method = "GET", data = null, token = null) => {
    const options = {
        method,
        headers: {}
    }

    if (data !== null) {
    options.headers["Content-Type"] = "application/json"
    options.body = JSON.stringify(data)
}

    if (token) {
        options.headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, options)
    const result = await response.json()

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong")
    }

    return result
}

const extractJobFromURL = (url, token = null) => {
    return apiCall("/job-url/extract-job", "POST", { url }, token)
}

const createApplication = (data, token) => {
    return apiCall("/application/create", "POST", data, token)
}

const getAllApplications = (token) => {
    return apiCall("/application/all", "GET", null, token)
}

const updateApplication = (id, data, token) => {
    return apiCall(`/application/update/${id}`, "PUT", data, token)
}

const deleteApplication = (id, token) => {
    return apiCall(`/application/delete/${id}`, "DELETE", null, token)
}

const createInterview = (data, token) =>
    apiCall("/interview/create", "POST", data, token)

export {
    extractJobFromURL,
    createApplication,
    getAllApplications,
    updateApplication,
    deleteApplication,
    createInterview
}

export default apiCall