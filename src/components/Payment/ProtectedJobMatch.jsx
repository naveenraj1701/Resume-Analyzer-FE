import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import JobMatch from "../../pages/JobMatch"
import apiCall from "../../services/api"

function ProtectedJobMatch() {
    const [isPaid, setIsPaid] = useState(null)

    useEffect(() => {
        const checkPayment = async () => {
            try {
                const token = localStorage.getItem("token")

                if (!token) {
                    setIsPaid(false)
                    return
                }

                const result = await apiCall(
                    "/payment/payment-status",
                    "GET",
                    null,
                    token
                )

                setIsPaid(result.paid)
            } catch (err) {
                setIsPaid(false)
            }
        }

        checkPayment()
    }, [])

    if (isPaid === null) {
        return <div className="p-6 text-center">Checking payment...</div>
    }

    if (!isPaid) {
        return <Navigate to="/dashboard" replace />
    }

    return <JobMatch />
}

export default ProtectedJobMatch