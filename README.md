# Urban Haven / WanderLust

**Project Overview**
- **Name:** Urban Haven (WanderLust app inside the WanderLust folder)
- **Description:** A Node.js / Express booking and listings application with user accounts, reviews, coupons, and booking management. Includes a web UI (EJS templates), file uploads, and admin views.

**Features**
- **Listings:** Create, edit, and show property listings.
- **Bookings:** User booking flows and admin booking management.
- **Auth:** User signup, login, profile, and reporting.
- **Reviews & Coupons:** Review system and coupon management.
- **Uploads:** Image/file uploads for listings.

**Prerequisites**
- **Node.js:** v14+ recommended
- **npm:** v6+ or yarn

**Installation**
- **Clone:** Clone the repository and install dependencies.

```bash
npm install
```

- **Project folders:** The main app is under the WanderLust folder. To install there:

```bash
cd WanderLust
npm install
```

**Environment Variables**
Create a `.env` file in the WanderLust folder (or set environment variables) with values similar to:

```env
PORT=3000
DATABASE_URL=your_mongodb_connection_string
SESSION_SECRET=replace_with_secure_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_KEY=...
CLOUDINARY_SECRET=...
```

**Configuration**
- **App entry:** WanderLust/app.js
- **Main routes:** WanderLust/routes and root-level routes in routes/
- **Models:** WanderLust/models and models/
- **Views:** EJS templates live in WanderLust/views and views/
- **Public assets:** public/ and WanderLust/public/

**Run (development)**
From the WanderLust folder:

```bash
npm run dev
# or
node app.js
```

If the root package.json is used, run from project root as appropriate.

**Project Structure (high level)**
- **WanderLust/**: main Express app folder with app.js and routes
- **models/**: data models (users, listings, bookings, coupons, reviews)
- **routes/**: route definitions for listings, bookings, users, coupons, reviews
- **views/**: EJS templates for pages and includes
- **public/**: static files (CSS, JS, images)
- **uploads/**: user-uploaded files

**Development Notes**
- **Error handling:** Uses custom ExpressError and wrapAsync utilities in utils/
- **File uploads:** Ensure uploads directory is writable and Cloudinary (or local storage) is configured if used.

**Contributing**
- **Issues & PRs:** Open an issue first to discuss larger changes, then submit a pull request with tests or manual verification steps.

**License**
- Add a license file or include license text here. If unsure, add an open-source license such as MIT.

**Contact**
- For questions or help, open an issue in the repo or contact the project maintainer.

---

If you want, I can customize this README with sample environment values, start scripts, or example screenshots. Tell me what to include.