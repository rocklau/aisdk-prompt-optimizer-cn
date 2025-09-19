"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";



export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
            完全开源 • 由 AISDK 提示优化器驱动
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AISDK 提示优化器
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            通过智能提示优化改变您的 AI 交互体验。
            教学您的 AI，收集理想样本，并使用强大的 AISDK 提示优化器生成优化的提示。
          </p>
          <div className="flex justify-center">
            <Link href="/chat">
              <Button size="lg" className="text-lg px-8 py-3">
                开始优化提示 →
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
              教学您的 AI
            </h3>
            <p className="text-muted-foreground">
              通过交互式对话指导您的 AI，并演示您想要实现的理想响应。
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
              收集理想样本
            </h3>
            <p className="text-muted-foreground">
              收集高质量的对话示例，这些示例代表了您用例的完美 AI 行为。
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
              AISDK 提示优化器
            </h3>
            <p className="text-muted-foreground">
              利用先进的优化算法自动生 成和优化提示候选项。
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="border rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            工作原理
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                开始对话
              </h4>
              <p className="text-sm text-muted-foreground">
                开始与 AI 聊天，并通过示例教学期望的行为
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                标记示例
              </h4>
              <p className="text-sm text-muted-foreground">
                保存代表完美响应的理想对话样本
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                运行优化
              </h4>
              <p className="text-sm text-muted-foreground">
                让 AISDK 提示优化器分析模式并生成优化的提示
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                部署结果
              </h4>
              <p className="text-sm text-muted-foreground">
                在您的应用程序中使用优化的提示
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
                &quot;DSPy 和 (特别是) GEPA 目前在 AI 上下文工程领域被严重低估&quot;
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
                  在 X 上查看 →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Team Attribution */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 text-muted-foreground mb-4">
            <span>由创建以下项目的团队 ❤️ 构建</span>
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
            <span className="text-muted-foreground">和</span>
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
              Apache 2.0 许可证 • 完全开源
            </div>
          </div>
        </div>

        {/* Local Development Setup */}
        <div className="border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            🚀 本地运行
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                前提条件
              </h3>
              <p className="text-muted-foreground mb-2">
                确保您的系统已安装 Node.js 和 uv。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                快速开始
              </h3>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-foreground text-sm">
                  {`# 克隆仓库
git clone https://github.com/Scale3-Labs/aisdk-prompt-optimizer
cd aisdk-prompt-optimizer

# 安装依赖
npm install

# 启动所有服务（推荐）
npm run dev:all

# 或者分别启动：
# 终端 1: 启动 Python 优化器
cd python_optimizer
uv run app.py

# 终端 2: 启动 Web 应用
npm run dev`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                可用脚本
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev
                  </code>{" "}
                  - 启动 Next.js 开发服务器
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev:py
                  </code>{" "}
                  - 启动 Python 优化器服务器
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    npm run dev:all
                  </code>{" "}
                  - 同时启动所有服务
                </li>
              </ul>
            </div>

            <div className="bg-muted border rounded-lg p-4">
              <p className="text-muted-foreground text-sm">
                <strong>💡 提示:</strong> Web 应用运行在{" "}
                <code>http://localhost:3000</code>，Python 优化器运行在{" "}
                <code>http://localhost:8000</code>。两个服务都需要运行才能使优化功能正常工作。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
