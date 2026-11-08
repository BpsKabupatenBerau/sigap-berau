Role & Objective:
Act as an expert Full-Stack Software Engineer specializing in Next.js 15 App Router, Tailwind CSS, shadcn/ui, and Prisma ORM with SQLite. Build a production-ready, highly secure, and fully functional web application named "SIGAP BERAU" (Sistem Pembinaan Statistik Sektoral yang Terintegrasi untuk Akselerasi Pembangunan Kabupaten Berau) for Badan Pusat Statistik (BPS) Kabupaten Berau.

---

### 1. Design & Styling Guidelines (CRITICAL)
- **Framework & Libraries:** Next.js (App Router), Tailwind CSS, shadcn/ui components, Lucide React icons.
- **Styling Rules:** STRICTLY NO inline styles (e.g., style={{...}} is forbidden). Use utility-first Tailwind classes exclusively.
- **Layout & Navigation:** Responsive desktop layout featuring a persistent collapsible Sidebar navigation menu.
- **Design Reference:** Follow the UI/UX layout patterns, color pallate, spacing, and typography from the provided Figma reference: [https://www.figma.com/design/GhpltC4agyWtc3uzlUjGcQ/sigap-berau?node-id=4-3439&t=B6R6jT1wOIetoDUi-0].
- **Theme:** can change theme on runtime using shadcn/ui theme provider
- **Language:** use Bahasa Indonesia for all text in application.
---

### 2. Database, Hosting & File Storage Specifications
- **Database:** SQLite (using Prisma ORM) with a complete database seed script (`prisma/seed.ts`) containing initial master data, roles, sample OPDs, and official EPSS domains/indicators.
- **Hosting Target:** Configured and optimized for deployment on Render.com.
- **File Upload Feature:** Secure server-side file upload handler storing documents locally (in `public/uploads/epss` or mounted directory) with strict validation:
  - Allowed MIME types: `.pdf`, `.zip`, `.docx`.
  - Maximum file size limit: 10MB per file with clear error handling.
- Use file Petunjuk Teknis Penilaian EPSS.docx as a source for EPSS Domains and Indicators and database.

---

### 3. User Roles & Access Control (RBAC)
Implement strict role-based route protection and permission guards for 3 roles:
1. **Superadmin:** 
   - Can manage and create user accounts for both OPD operators and Sectoral Pembina (`/dashboard/users`).
   - Can act as Pembina Sektoral or Operator OPD by impersonating them.
2. **Pembina Sektoral (BPS):** 
   - Can view all OPD submissions, input maturity level scores (Scale 1–5), and leave review comments/feedback on the EPSS assessment page (`/dashboard/epss/penilaian`).
   - can see pdf viewer to see evidence documents. 
3. **Operator OPD:** 
   - Can upload, replace, and manage evidence documents (`.pdf`/`.zip`) linked to specific EPSS indicators for their respective OPD (`/dashboard/epss/upload`).

---

### 4. Core Application Modules & Pages
1. **Authentication Page (`/login`):**
   - Clean split-screen login supporting role-based authentication and secure session management.
2. **Dashboard & Sidebar Navigation (`/dashboard`):**
   - Overview metrics (Total OPD, active coaching schedules, EPSS completion percentage).
3. **Schedule & Sectoral Activities (`/dashboard/pembinaan`):**
   - Interactive calendar and list view of coaching schedules between BPS and various regional OPDs/Agencies.
4. **Knowledge Base Repository (`/dashboard/materi`):**
   - Searchable file repository and guideline downloads accessible to all OPDs.
5. **EPSS Assessment Module (`/dashboard/epss`):**
   - Comprehensive hierarchical data table structured by official EPSS Domains and Indicators.
   - Operators can upload/update supporting evidence documents.
   - Pembina Sektoral can evaluate, score, and write comments directly within the table rows or modal interface.
   - Pembina Sektoral can see all progress for all OPDs before enter the review page.
   - can change period/year for showing progress