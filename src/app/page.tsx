import Link from "next/link"
import { ArrowRight, BarChart3, Brain, MessageSquare, Sparkles, Zap, Shield, Layers, FileText } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold">LOOP</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
            <Sparkles className="h-4 w-4" />
            AI-Powered Feedback Intelligence
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900">
            Turn Customer Feedback Into Your Next Best Decision
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Project LOOP collects customer feedback from every channel, uses AI to understand sentiment and themes, and delivers actionable business intelligence to your team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-700"
            >
              Start Analyzing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl border bg-white p-2 shadow-2xl">
            <div className="rounded-xl bg-gray-50 p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Feedback", value: "1,248", change: "+12%" },
                  { label: "Positive", value: "68%", change: "+5%" },
                  { label: "Negative", value: "18%", change: "-3%" },
                  { label: "Open Issues", value: "94", change: "-8%" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white p-4 border">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs ${stat.change.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                      {stat.change}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white border p-4">
                  <p className="text-sm font-medium mb-3">Sentiment Over Time</p>
                  <div className="h-32 flex items-end gap-1">
                    {[40, 55, 45, 60, 50, 65, 70, 60, 75, 80, 72, 85].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-400 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-white border p-4">
                  <p className="text-sm font-medium mb-3">Top Themes</p>
                  <div className="space-y-2">
                    {["Performance", "UX", "Mobile", "Checkout"].map((theme, i) => (
                      <div key={theme} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-violet-500" />
                        <span className="text-xs text-gray-600">{theme}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${[72, 58, 84, 49][i]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Intelligence built into every feedback</h2>
          <p className="mb-12 text-center text-gray-600">Everything you need to understand your customers</p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Brain, title: "AI Classification", desc: "Automatically classify feedback by sentiment, category, and priority using Claude AI." },
              { icon: Layers, title: "Theme Detection", desc: "AI clusters feedback into recurring themes and detects emerging trends." },
              { icon: BarChart3, title: "Sentiment Analysis", desc: "Track positive, negative, and neutral sentiment over time." },
              { icon: MessageSquare, title: "Ask LOOP", desc: "Ask natural language questions about your customer feedback." },
              { icon: FileText, title: "VoC Reports", desc: "Generate Voice-of-Customer reports with AI-powered insights." },
              { icon: Shield, title: "Multi-Tenant", desc: "Secure workspace isolation with role-based access control." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-white p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <feature.icon className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">How LOOP works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { step: "01", title: "Collect", desc: "Gather feedback from support, reviews, surveys, and sales." },
              { step: "02", title: "Analyze", desc: "AI classifies sentiment and detects themes automatically." },
              { step: "03", title: "Discover", desc: "Identify trends, clusters, and actionable patterns." },
              { step: "04", title: "Decide", desc: "Make data-driven decisions with AI-powered insights." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white font-bold">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="border-t bg-violet-50 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700">
            <Zap className="h-4 w-4" />
            Powered by Claude AI
          </div>
          <h2 className="mb-4 text-3xl font-bold">AI that understands your customers</h2>
          <p className="mb-8 text-gray-600">
            LOOP uses Anthropic&apos;s Claude to analyze every piece of feedback, detect sentiment, identify themes, and answer your questions about customer experience.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "Classification", example: "Sentiment: Negative\nCategory: Performance\nPriority: High" },
              { title: "Themes", example: "Theme: Checkout Performance\n42% increase this month" },
              { title: "Insights", example: "Customers are frustrated by slow mobile checkout." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-6 text-left shadow-sm border">
                <h3 className="mb-3 font-semibold">{item.title}</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono bg-gray-50 rounded-lg p-3">
                  {item.example}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Start turning feedback into intelligence</h2>
          <p className="mb-8 text-gray-600">
            Join teams that use LOOP to understand their customers better and make smarter product decisions.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="font-bold">LOOP</span>
              </div>
              <p className="text-sm text-gray-600">AI-powered customer feedback intelligence.</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/register" className="hover:text-gray-900">Features</Link></li>
                <li><Link href="/register" className="hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-gray-900">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-gray-900">About</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Contact</Link></li>
                <li><Link href="#" className="hover:text-gray-900">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-gray-900">Privacy</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500">
            2024 Project LOOP. Built with AI.
          </div>
        </div>
      </footer>
    </div>
  )
}
