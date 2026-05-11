# 🚀 Deploy MediaVault ke GitHub

## Metode 1: Via Command Line (Recommended)

### Step 1: Initialize Git Repository
```bash
cd /workspaces/default/code
git init
```

### Step 2: Add All Files
```bash
git add .
```

### Step 3: Create First Commit
```bash
git commit -m "Initial commit: MediaVault platform with 26 pages"
```

### Step 4: Create GitHub Repository
1. Buka https://github.com/new
2. Repository name: `mediavault` (atau nama lain)
3. Description: `Indonesia's boldest platform for creative photography & video services`
4. Choose: **Public** or **Private**
5. **JANGAN** centang "Initialize with README" (karena sudah ada)
6. Click **Create repository**

### Step 5: Connect to GitHub
```bash
# Ganti USERNAME dan REPO-NAME sesuai GitHub Anda
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### Step 6: Verify
Buka repository Anda di GitHub untuk memastikan semua file sudah terupload.

---

## Metode 2: Via GitHub CLI (gh)

### Install GitHub CLI (if not installed)
```bash
# Check if gh is installed
gh --version

# If not, install:
# Mac: brew install gh
# Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

### Login to GitHub
```bash
gh auth login
```

### Create & Push Repository
```bash
cd /workspaces/default/code
git init
git add .
git commit -m "Initial commit: MediaVault platform"

# Create GitHub repo and push (one command!)
gh repo create mediavault --public --source=. --push
```

---

## Metode 3: Via GitHub Desktop

1. Download **GitHub Desktop**: https://desktop.github.com/
2. Install dan login
3. Click **File** → **Add Local Repository**
4. Choose folder: `/workspaces/default/code`
5. Click **Publish Repository**
6. Choose: Public/Private
7. Click **Publish**

---

## 📋 Quick Command Reference

### Initial Setup (First Time)
```bash
cd /workspaces/default/code
git init
git add .
git commit -m "Initial commit: MediaVault platform"
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### Future Updates
```bash
# Add changes
git add .

# Commit with message
git commit -m "Update: description of changes"

# Push to GitHub
git push
```

### Useful Git Commands
```bash
# Check status
git status

# See what changed
git diff

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout branch-name

# Merge branch
git merge branch-name
```

---

## 🔒 .gitignore Setup

Make sure you have `.gitignore` to exclude unnecessary files:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Vite
.vite/
vite.config.js.timestamp-*

# Temp
*.tmp
.cache/
EOF
```

---

## 📦 What Will Be Uploaded?

### ✅ Will be uploaded:
- All source code (`/src`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation files (`.md`)
- Public assets (`/public`)
- Guidelines (`/guidelines`)

### ❌ Won't be uploaded (via .gitignore):
- `node_modules/` (dependencies)
- `.vite/` (cache)
- `.env` files (secrets)
- Build output

---

## 🎯 Example Complete Workflow

```bash
# 1. Navigate to project
cd /workspaces/default/code

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. First commit
git commit -m "feat: Initial MediaVault platform with 26 pages

- Landing page with hero and features
- Authentication (Login/Register/Role Selection)
- Client Dashboard (9 pages)
- Freelancer Dashboard (9 pages)
- Shared pages (Post Job, Freelancer Profile)
- Complete routing with React Router
- MediaVault design system
- Responsive Tailwind CSS"

# 5. Add GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/mediavault.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🌟 Pro Tips

### 1. Use Meaningful Commit Messages
```bash
# Good
git commit -m "feat: Add freelancer portfolio page"
git commit -m "fix: Resolve navbar logout issue"
git commit -m "style: Update button hover effects"

# Bad
git commit -m "updates"
git commit -m "fixes"
git commit -m "wip"
```

### 2. Commit Convention
```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
test: Add/update tests
chore: Build process, dependencies, etc.
```

### 3. Branch Strategy
```bash
main          # Production-ready code
develop       # Development branch
feature/*     # New features
bugfix/*      # Bug fixes
hotfix/*      # Urgent fixes
```

---

## 🔗 After Pushing to GitHub

### 1. Add README.md
Create a nice README for your repo with:
- Project description
- Screenshots
- Installation instructions
- Usage guide

### 2. Add License
Choose a license: MIT, Apache, GPL, etc.

### 3. Enable GitHub Pages (Optional)
If you want to deploy:
1. Go to Settings → Pages
2. Source: GitHub Actions
3. Use Vite/React deployment workflow

### 4. Protect Main Branch
1. Settings → Branches
2. Add rule for `main`
3. Enable "Require pull request reviews"

---

## 🚨 Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

### Error: "Permission denied"
```bash
# Use SSH instead of HTTPS
git remote set-url origin git@github.com:USERNAME/REPO.git
```

### Error: "Updates were rejected"
```bash
# Force push (CAREFUL!)
git push -f origin main
```

### Large files error
```bash
# Remove large files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large-file" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📱 GitHub Mobile App

You can also manage your repo from:
- **GitHub Mobile** (iOS/Android)
- View commits, PRs, issues
- Merge pull requests
- Review code

---

**Happy Coding! 🚀**

Need help? Check: https://docs.github.com/en/get-started
