import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiCreditCard, FiLoader, FiShield, FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import apiCall from "../../services/api"

const Payment = () => {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("success")

    const notify = (text, type = "success") => {
        setMessage(text)
        setMessageType(type)
    }

    const handlePayment = async () => {
        try {
            setLoading(true)
            setMessage("")

            const token = localStorage.getItem("token")

            if (!token) {
                throw new Error("Please login first")
            }

            if (!window.Razorpay) {
                throw new Error("Razorpay Checkout is not loaded. Please refresh the page.")
            }

            const result = await apiCall(
                "/payment/create-order",
                "POST",
                { amount: 500 },
                token
            )

            const {
                order_id,
                amount,
                currency,
                key_id
            } = result.data

            const options = {
                key: key_id,
                amount,
                currency,
                name: "AI Resume Analyzer",
                description: "One-time Payment",
                order_id,

                handler: async (paymentResponse) => {
                    try {
                        const verifyResult = await apiCall(
                            "/payment/verify-payment",
                            "POST",
                            {
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            },
                            token
                        )

                        notify(verifyResult.message || "Payment successful")

                        // Reload so the Dashboard re-checks the payment status and unlocks Job Matching
                        setTimeout(() => window.location.reload(), 1500)
                    } catch (err) {
                        notify(err.message, "error")
                    }
                },

                modal: {
                    ondismiss: () => {
                        notify("Payment cancelled", "error")
                    }
                },

                theme: {
                    color: "#4f46e5"
                }
            }

            const razorpay = new window.Razorpay(options)

            razorpay.on("payment.failed", (response) => {
                notify(response.error.description || "Payment failed", "error")
            })

            razorpay.open()

        } catch (err) {
            notify(err.message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                onClick={handlePayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <FiLoader className="animate-spin" /> Please wait...
                    </>
                ) : (
                    <>
                        <FiCreditCard /> Pay ₹500
                    </>
                )}
            </motion.button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <FiShield /> Secure one-time payment via Razorpay
            </p>

            <AnimatePresence>
                {message && (
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                                messageType === "error"
                                    ? "border-rose-200 bg-rose-50 text-rose-600"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-600"
                            }`}
                        >
                            <span className="mt-0.5 text-base">
                                {messageType === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
                            </span>
                            <p>{message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Payment