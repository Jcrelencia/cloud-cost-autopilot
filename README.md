# Cloud Cost Autopilot

> Automating Cloud Waste Detection and Savings Recommendations

## 📋 Project Overview

Cloud Cost Autopilot is a data dashboard that helps users monitor and optimize their AWS cloud spending. It connects to AWS accounts, analyzes cost data, and provides actionable recommendations to reduce waste.

**Tech Stack:**
- **Frontend:** React, Material-UI, Recharts
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Cloud Integration:** AWS SDK (Cost Explorer, CloudWatch)

**Quarter:** Winter 2026 (CSS 497 Capstone)

---

##  Project Structure
```
cloud-cost-autopilot/
│
├── client/                 # React frontend
│   ├── public/            # Static files (index.html, favicon)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Settings, etc.)
│   │   ├── services/      # API service calls
│   │   ├── utils/         # Helper functions
│   │   ├── App.js         # Main app component
│   │   ├── index.js       # Entry point
│   │   └── App.css        # Global styles
│   ├── package.json       # Frontend dependencies
│   └── .env               # Frontend environment variables
│
├── server/                # Node.js + Express backend
│   ├── config/           # Database config, AWS config
│   ├── controllers/      # Route handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, error handling
│   ├── services/         # AWS SDK integration
│   ├── utils/            # Helper functions
│   ├── server.js         # Entry point
│   ├── package.json      # Backend dependencies
│   └── .env              # Backend environment variables (DB, AWS keys)
│
├── database/              # Database scripts
│   ├── schema.sql        # Table definitions
│   ├── seed.sql          # Sample data (optional)
│   └── migrations/       # Database version control
│
├── docs/                  # Documentation
│   ├── design-spec.md    # Design specification
│   ├── api-docs.md       # API documentation
│   └── setup-guide.md    # Setup instructions
│
├── .gitignore            # Files to ignore in Git
├── README.md             # This file
└── package.json          # Root-level scripts (optional)
```

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Git
- AWS Account (for testing)

### Installation



## Database Schema

### Tables
- **users** - User accounts
- **aws_accounts** - Connected AWS accounts
- **cost_data** - Historical cost data
- **recommendations** - Savings suggestions
- **alerts** - Spending alerts

*(See `database/schema.sql` for full schema)*

---

## 📡 API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### AWS Accounts
- `GET /api/accounts` - List connected accounts
- `POST /api/accounts` - Connect new AWS account
- `DELETE /api/accounts/:id` - Disconnect account

### Cost Data
- `GET /api/costs` - Fetch cost data
- `GET /api/costs/trends` - Cost trends over time

### Recommendations
- `GET /api/recommendations` - Get savings recommendations

*(See `docs/api-docs.md` for full API documentation)*

---

## 🧪 Testing
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

---

## 🚢 Deployment

*(Deployment instructions will be added in Quarter 2)*

**Planned Hosting:**
- Frontend: Vercel or Netlify
- Backend: Render or Railway
- Database: Render PostgreSQL

---

## 📝 Project Timeline

**Week 2 (Current):** Environment setup, basic project structure  
**Week 3:** Database schema, Express API skeleton  
**Week 4:** React frontend skeleton, first full-stack feature  
**Week 5:** AWS SDK integration, cost data fetching  
**Week 6-8:** Core features development  
**Week 9-10:** Testing, polish, documentation  

---

## 👤 Author

**Jack Crelencia**  
CSS 497 Capstone - Winter 2026  
University of Washington Bothell

---

## 📄 License

This project is for educational purposes as part of a university capstone project.

---

## 🔗 Resources

- [AWS Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/APIReference/Welcome.html)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/)
```

---

## **File 2: .gitignore**
(Save in: `C:\Users\jpcre\cloud-cost-autopilot\.gitignore`)
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment Variables
.env
.env.local
.env.development
.env.test
.env.production

# Database
*.db
*.sqlite
*.sqlite3

# Build outputs
client/build/
server/build/
dist/
*.log

# IDE / Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/

# OS files
Thumbs.db
.DS_Store

# AWS credentials (NEVER commit these!)
**/aws-credentials.json
**/aws-config.json

# Sensitive data
**/secrets/
**/private/