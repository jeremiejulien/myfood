import { useEffect, useMemo, useState } from "react"

const EMAIL_COOLDOWN_SECONDS = 60
const LAST_EMAIL_SENT_KEY = "assocAlim.auth.lastEmailSentAt"
const PRODUCTION_AUTH_REDIRECT_URL = "https://myfood-cyan.vercel.app"

function getRateLimitMessage() {
  return "Trop de demandes de connexion par email. Attends quelques minutes avant de réessayer."
}

function getAuthRedirectUrl() {
  const { hostname, origin } = window.location
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin
  return PRODUCTION_AUTH_REDIRECT_URL
}

export default function AuthPanel({ supabaseClient, framed = true }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [remainingCooldown, setRemainingCooldown] = useState(0)

  const cleanEmail = useMemo(() => email.trim(), [email])

  useEffect(() => {
    function refreshCooldown() {
      const lastSentAt = Number(window.localStorage.getItem(LAST_EMAIL_SENT_KEY) || 0)
      const elapsedSeconds = Math.floor((Date.now() - lastSentAt) / 1000)
      setRemainingCooldown(Math.max(0, EMAIL_COOLDOWN_SECONDS - elapsedSeconds))
    }

    refreshCooldown()
    const intervalId = window.setInterval(refreshCooldown, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (!cleanEmail || remainingCooldown > 0) return

    setIsSending(true)
    setStatus("")
    setError("")

    const { error: signInError } = await supabaseClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    if (signInError) {
      if (signInError.message.toLowerCase().includes("rate limit")) {
        window.localStorage.setItem(LAST_EMAIL_SENT_KEY, String(Date.now()))
        setRemainingCooldown(EMAIL_COOLDOWN_SECONDS)
        setError(getRateLimitMessage())
      } else {
        setError(signInError.message)
      }
    } else {
      window.localStorage.setItem(LAST_EMAIL_SENT_KEY, String(Date.now()))
      setRemainingCooldown(EMAIL_COOLDOWN_SECONDS)
      setStatus("Lien envoyé. Ouvre ton email pour te connecter.")
    }

    setIsSending(false)
  }

  return (
    <section className={framed ? "mx-auto max-w-lg rounded-2xl border bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6" : "space-y-5"}>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Connexion au journal</h2>
        <p className="text-sm text-gray-500">
          Entre ton email pour recevoir un lien de connexion. Tes prises et ressentis seront ensuite synchronisés avec ton compte.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="toi@example.com"
            className="min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-gray-200"
            autoComplete="email"
            required
          />
        </label>

        <button
          type="submit"
          disabled={isSending || remainingCooldown > 0}
          className="min-h-12 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSending ? "Envoi..." : remainingCooldown > 0 ? `Réessayer dans ${remainingCooldown}s` : "Recevoir le lien"}
        </button>
      </form>

      {status && <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">{status}</p>}
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </section>
  )
}
