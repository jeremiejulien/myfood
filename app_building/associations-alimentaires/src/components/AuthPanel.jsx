import { useState } from "react"

export default function AuthPanel({ supabaseClient, framed = true }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) return

    setIsSending(true)
    setStatus("")
    setError("")

    const { error: signInError } = await supabaseClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (signInError) {
      setError(signInError.message)
    } else {
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
          disabled={isSending}
          className="min-h-12 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSending ? "Envoi..." : "Recevoir le lien"}
        </button>
      </form>

      {status && <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">{status}</p>}
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </section>
  )
}
