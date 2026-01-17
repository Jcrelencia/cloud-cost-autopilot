# Cloud Cost Autopilot - Development Environment Setup

## ✅ Required Tools Checklist

### 1. Version Control
- [ ] **Git** installed
  - Check: `git --version`
  - Install: https://git-scm.com/downloads
- [ ] **GitHub account** created
  - Sign up: https://github.com

### 2. Code Editor
- [ ] **VS Code** installed
  - Download: https://code.visualstudio.com/
- [ ] **Recommended VS Code Extensions:**
  - [ ] ESLint (JavaScript linting)
  - [ ] Prettier (code formatting)
  - [ ] ES7+ React/Redux/React-Native snippets
  - [ ] PostgreSQL (database management)
  - [ ] GitLens (enhanced Git features)

### 3. Node.js & npm
- [ ] **Node.js (v18 or higher)** installed
  - Check: `node --version`
  - Download: https://nodejs.org/en (choose LTS version)
- [ ] **npm** comes with Node.js
  - Check: `npm --version`

### 4. PostgreSQL Database
- [ ] **PostgreSQL (v14 or higher)** installed
  - Check: `psql --version`
  - Download: https://www.postgresql.org/download/
- [ ] **Database created** for the project
  - Create: `createdb cloud_cost_autopilot`
- [ ] **Optional: pgAdmin** (GUI for PostgreSQL)
  - Download: https://www.pgadmin.org/download/

### 5. API Testing Tool
- [ ] **Postman** installed
  - Download: https://www.postman.com/downloads/
  - Alternative: Insomnia, Thunder Client (VS Code extension)

### 6. Browser DevTools
- [ ] **Chrome** or **Firefox** (for React DevTools)
- [ ] **React Developer Tools** extension installed

---

## 🚀 Quick Verification Commands

Run these in your terminal to verify everything is installed:
```powershell
# Git
git --version

# Node.js
node --version

# npm
npm --version

# PostgreSQL
psql --version
```

---

## 📦 Project Dependencies (Install Later)

Once your project is set up, you'll install these via npm:

### Frontend (React)
- `react` - UI library
- `react-router-dom` - routing
- `recharts` - charts/graphs
- `axios` - HTTP requests
- `@mui/material` - Material-UI components

### Backend (Node.js + Express)
- `express` - web framework
- `pg` - PostgreSQL client
- `dotenv` - environment variables
- `cors` - cross-origin requests
- `aws-sdk` - AWS API integration

### Dev Tools
- `nodemon` - auto-restart server
- `concurrently` - run frontend + backend together

---

## 🔧 Configuration Files (Create Later)

You'll need these config files in your project:
- `.gitignore` - files to exclude from Git ✅
- `.env` - environment variables (DB credentials, AWS keys)
- `package.json` - project dependencies
- `README.md` - project documentation ✅

---

## ✨ You're Ready When:
- ✅ All tools are installed
- ✅ You can run `git`, `node`, `npm`, `psql` commands
- ✅ VS Code opens and has recommended extensions
- ✅ Postman is installed and ready to test APIs
- ✅ PostgreSQL database is running

---

**Next Step:** Create your project repository structure!