# AISDK Prompt Optimizer

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)

Transform your AI interactions with intelligent prompt optimization. Teach your AI, collect ideal samples, and generate optimized prompts using the powerful AISDK Prompt Optimizer.

**Fully Open Source** - Built by the team that created [Langtrace AI](https://langtrace.ai) and [Zest](https://heyzest.ai)

## What is GEPA?

**GEPA** (Genetic-Pareto) is a reflective optimizer that adaptively evolves textual components (such as prompts) of AI systems. Unlike traditional optimization methods that only use scalar scores, GEPA leverages rich textual feedback to guide the optimization process, allowing it to propose high-performing prompts in very few rollouts.

Key features of GEPA:
- **Reflective Prompt Mutation**: Uses LLMs to reflect on execution traces and propose new instructions
- **Rich Textual Feedback**: Leverages any textual feedback beyond just scalar rewards
- **Pareto-based Selection**: Maintains a frontier of candidates that excel in different scenarios

Learn more: [GEPA Documentation](https://dspy.ai/api/optimizers/GEPA/)

## How It Works

1. **Start Conversation**: Begin chatting with the AI and teach it desired behaviors through examples
2. **Mark Examples**: Save ideal conversation samples that represent perfect responses
3. **Run Optimization**: Let AISDK Prompt Optimizer analyze patterns and generate optimized prompts
4. **Deploy Results**: Use the optimized prompts in your applications

## Features

- **Teach Your AI**: Guide your AI through interactive conversations and demonstrate the ideal responses you want to achieve
- **Collect Ideal Samples**: Gather high-quality conversation examples that represent perfect AI behavior for your use case
- **AISDK Prompt Optimizer**: Leverage advanced optimization algorithms to automatically generate and refine prompt candidates

## Quick Start

### Prerequisites
- Node.js (18+ recommended)
- `uv` package manager for Python
- OpenAI API key
- AI Gateway API key

### Environment Setup

Before running the application, you need to set up your environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API keys:
   ```bash
   # Required: OpenAI API key for AI model access
   OPENAI_API_KEY=your_actual_openai_api_key_here
   
   # Required: AI Gateway API key for prompt optimization
   AI_GATEWAY_API_KEY=your_actual_ai_gateway_api_key_here
   ```

**Important**: Never commit your actual API keys to version control. The `.env` file is already included in `.gitignore`.

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Scale3-Labs/aisdk-prompt-optimizer
cd aisdk-prompt-optimizer

# Install dependencies
npm install

# Start both services (recommended)
npm run dev:all
```

### Alternative: Start Services Separately

```bash
# Terminal 1: Start the Python optimizer
cd python_optimizer
uv run app.py

# Terminal 2: Start the web app
npm run dev
```

The web app will be available at `http://localhost:3000` and the Python optimizer at `http://localhost:8000`. Both services need to be running for the optimization features to work.

## Available Scripts

- `npm run dev` - Start the Next.js development server
- `npm run dev:py` - Start the Python optimizer server
- `npm run dev:all` - Start both services concurrently

## Architecture

### Python Optimizer (dspy.GEPA)

The repository includes a lightweight Flask server exposing the `dspy.GEPA` optimizer, managed with `uv`. The Next.js `/api/optimize` route calls this server and writes optimization artifacts to:
- `data/prompt.md` - Generated optimized prompts
- `data/complete-optimization.json` - Complete optimization results and metadata

### Web Application

Built with Next.js and shadcn/ui components, the web interface provides:
- Interactive chat interface for teaching the AI
- Sample collection and management
- Optimization trigger and results visualization
- Modern, responsive UI with dark/light mode support

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python Flask server with dspy.GEPA optimizer
- **Package Management**: npm (frontend), uv (Python)

## Learn More

- [DSPy Documentation](https://dspy.ai/)
- [GEPA Optimizer API](https://dspy.ai/api/optimizers/GEPA/)
- [Next.js Documentation](https://nextjs.org/docs)

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For the Python optimizer, you'll need to deploy it to a Python-compatible hosting service and update the API endpoints accordingly.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! This is a fully open source project. Please feel free to submit issues and pull requests.

## About

Built with ❤️ by the team that created [Langtrace AI](https://langtrace.ai) and [Zest](https://heyzest.ai).