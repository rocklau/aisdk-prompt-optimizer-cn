import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
            Fully Open Source • Powered by AISDK Prompt Optimizer
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AISDK Prompt Optimizer
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your AI interactions with intelligent prompt optimization.
            Teach your AI, collect ideal samples, and generate optimized prompts
            using the powerful AISDK Prompt Optimizer.
          </p>
          <div className="flex justify-center">
            <Link href="/chat">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Optimizing Prompts →
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Teach Your AI
            </h3>
            <p className="text-muted-foreground">
              Guide your AI through interactive conversations and demonstrate
              the ideal responses you want to achieve.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Collect Ideal Samples
            </h3>
            <p className="text-muted-foreground">
              Gather high-quality conversation examples that represent the
              perfect AI behavior for your use case.
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              AISDK Prompt Optimizer
            </h3>
            <p className="text-muted-foreground">
              Leverage advanced optimization algorithms to automatically
              generate and refine prompt candidates.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="border rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Start Conversation
              </h4>
              <p className="text-sm text-muted-foreground">
                Begin chatting with the AI and teach it desired behaviors
                through examples
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Mark Examples
              </h4>
              <p className="text-sm text-muted-foreground">
                Save ideal conversation samples that represent perfect responses
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Run Optimization
              </h4>
              <p className="text-sm text-muted-foreground">
                Let AISDK Prompt Optimizer analyze patterns and generate
                optimized prompts
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Deploy Results
              </h4>
              <p className="text-sm text-muted-foreground">
                Use the optimized prompts in your applications
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="border rounded-lg p-8 bg-muted/30">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <blockquote className="text-xl font-medium text-foreground mb-4">
                &quot;Both DSPy and (especially) GEPA are currently severely
                under hyped in the AI context engineering world&quot;
              </blockquote>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TL</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">
                    Tobi Lutke
                  </div>
                  <div className="text-sm text-muted-foreground">
                    CEO, Shopify
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="https://x.com/tobi/status/1963434604741701909"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm transition-colors"
                >
                  View on X →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Team Attribution */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 text-muted-foreground mb-4">
            <span>Built with ❤️ by the team that created</span>
          </div>
          <div className="flex justify-center items-center space-x-3">
            <a
              href="https://langtrace.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-semibold"
            >
              Langtrace AI
            </a>
            <span className="text-muted-foreground">and</span>
            <a
              href="https://heyzest.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-semibold"
            >
              Zest
            </a>
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              Apache 2.0 Licensed • Fully Open Source
            </div>
          </div>
        </div>

        {/* Local Development Setup */}
        <div className="border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            🚀 Run Locally
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Prerequisites
              </h3>
              <p className="text-muted-foreground mb-2">
                Make sure you have Node.js and uv installed on your system.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Quick Start
              </h3>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-foreground text-sm">
                  {`# Clone the repository
git clone https://github.com/Scale3-Labs/aisdk-prompt-optimizer
cd aisdk-prompt-optimizer

# Install dependencies
npm install

# Start both services (recommended)
npm run dev:all

# Or start them separately:
# Terminal 1: Start the Python optimizer
cd python_optimizer
uv run app.py

# Terminal 2: Start the web app
npm run dev`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Available Scripts
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev
                  </code>{" "}
                  - Start the Next.js development server
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev:py
                  </code>{" "}
                  - Start the Python optimizer server
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev:all
                  </code>{" "}
                  - Start both services concurrently
                </li>
              </ul>
            </div>

            <div className="bg-muted border rounded-lg p-4">
              <p className="text-muted-foreground text-sm">
                <strong>💡 Tip:</strong> The web app runs on{" "}
                <code>http://localhost:3000</code> and the Python optimizer on{" "}
                <code>http://localhost:8000</code>. Both services need to be
                running for the optimization features to work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
