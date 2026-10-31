# Contributing to AYMAN STUDY AI

Thank you for your interest in contributing to **AYMAN STUDY AI**! We welcome contributions from developers, designers, educators, and students around the world.

Please review the guidelines below to maintain high code quality, security, and academic accuracy.

---

## Code of Conduct

* Treat all contributors with respect, courtesy, and encouragement.
* Focus on constructive code reviews and helpful feedback.
* Zero tolerance for harassment, offensive language, or discriminatory behavior.

---

## Development Workflow

### 1. Fork & Branch
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/MohammedAyman07/ayman-study-ai.git
   cd ayman-study-ai
   ```
3. Create a feature or bugfix branch:
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/issue-description
   ```

### 2. Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Code Standards & Quality Checks
Before submitting a Pull Request, ensure all tests and lints pass:
```bash
# Typecheck TypeScript source
npm run lint

# Production build verification
npm run build
```

* **No Hardcoded Keys:** NEVER include real API keys, passwords, or secrets in any file or test code.
* **Component Modularity:** Write clean, reusable, and properly typed React components.
* **Styling Consistency:** Use Tailwind CSS 4 utility classes matching existing design tokens.
* **Mathematical Rendering:** Always test LaTeX formulas inside KaTeX blocks (`$$ ... $$`).

### 4. Commit Conventions
Use clear, semantic commit messages:
* `feat:` A new user-facing feature.
* `fix:` A bug fix.
* `docs:` Documentation updates.
* `style:` Formatting or UI styling without logic changes.
* `refactor:` Code reorganization without behavioral modifications.
* `sec:` Security enhancements.

---

## Submitting Pull Requests

1. Push your branch to GitHub:
   ```bash
   git push origin feature/amazing-feature
   ```
2. Open a Pull Request against the `main` branch.
3. Provide a clear description of the problem solved, changes made, and screenshots for UI updates.
4. Verify all automated checks pass.

Thank you for helping empower students worldwide through AI-assisted education!
