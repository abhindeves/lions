# LionsManager Production Readiness Document

This document provides an overview of the LionsManager application, its technical stack, and essential information for deploying it to a production environment.

## 1. Project Overview

LionsManager is a web application built with Next.js and MongoDB, designed to help manage a Lions Club. It provides a dashboard for tracking members, events, and subscriptions, offering functionalities for adding, editing, deleting, and viewing records.

## 2. Implemented Features

*   **Dashboard:** Provides an overview of club activities, including total members, active members, upcoming events, and dynamically calculated outstanding dues.
*   **Member Management:**
    *   Add new members with details like full name, email, status, membership type, start date, and profile photo URL.
    *   View a list of all members with filtering by status (All, Active, Inactive) and search by name or email.
    *   Edit existing member details.
    *   Delete members.
    *   Seed initial member data.
    *   Export member data to an Excel file.
*   **Event Management:**
    *   Add new events with details like name, date, time, venue, description, event type, and status.
    *   View a list of all events with filtering by status (All, Upcoming, Completed, Canceled) and search by name or venue.
    *   Edit existing event details.
    *   Delete events.
    *   Seed initial event data.
    *   Export event data to an Excel file.
*   **Subscription Management:**
    *   Add new subscription payments, linking them to existing members.
    *   View a list of all subscriptions with filtering by status (All, Paid, Unpaid, Partial) and search by member name.
    *   Edit existing subscription payment details.
    *   View associated member details directly from a subscription record.
    *   Seed initial subscription data.
    *   Export subscription data to an Excel file.
*   **Authentication:** Simple email/password login (hardcoded for demonstration, requires proper implementation for production).

## 3. Technical Stack

*   **Frontend Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Database:** MongoDB
*   **Database ORM/Driver:** `mongodb` Node.js driver
*   **AI Integration:** Genkit (currently minimal, `src/ai/dev.ts` and `src/ai/genkit.ts` exist)
*   **Form Management:** React Hook Form with Zod for validation
*   **Data Export:** `xlsx` library for Excel file generation
*   **Charting:** Recharts
*   **Date Management:** `date-fns`
*   **Type Checking:** TypeScript
*   **Linting:** ESLint (requires proper configuration for production)

## 4. Getting Started (Development)

### Prerequisites

*   Node.js (version 20 or higher recommended)
*   MongoDB instance (local or cloud-hosted)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/lions-manager.git
    cd lions-manager
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the root directory and add your MongoDB connection string:
    ```
    MONGODB_URI=your-mongodb-connection-string
    ```
    (Example: `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ll56ncq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:9002`.

## 5. Deployment Considerations (Production)

### Environment Variables

The following environment variables are crucial for production:

*   `MONGODB_URI`: **Required.** The connection string for your MongoDB database. This should be securely managed in your production environment (e.g., using a secrets manager).
*   **Authentication Secrets:** The current authentication is hardcoded. For production, a robust authentication system (e.g., NextAuth.js, Passport.js, or a dedicated auth service) with secure secret management is **critical**.

### Database Setup

*   Ensure your MongoDB instance is accessible from your production environment.
*   Database seeding (`/dashboard/members`, `/dashboard/events`, `/dashboard/subscriptions` pages have "Seed Data" buttons) is for development/initial setup. For production, consider a proper migration strategy or initial data loading script.

### Build Process

The application is a Next.js project. The standard build command is:

```bash
npm run build
```

This command compiles the Next.js application for production.

### Hosting

*   **Firebase App Hosting:** The `apphosting.yaml` file suggests Firebase App Hosting is a consideration. Ensure Firebase project setup and deployment configurations are complete.
*   **Vercel/Netlify:** Next.js applications are well-suited for serverless platforms like Vercel or Netlify.
*   **Node.js Server:** The `npm start` command will run the production build:
    ```bash
    npm start
    ```

### Security

*   **Authentication:** As mentioned, the current authentication is a placeholder. Implement a secure authentication mechanism.
*   **Input Validation:** While Zod is used for form validation on the frontend, **server-side validation is paramount** for all API routes (`src/app/api/`) and server actions (`src/app/actions.ts`) to prevent malicious data injection.
*   **Environment Variables:** Never hardcode sensitive information (API keys, database credentials) directly in the code. Use environment variables and secure secret management.
*   **CORS:** If the frontend and backend are hosted on different domains, ensure proper Cross-Origin Resource Sharing (CORS) policies are configured on the backend.
*   **Dependency Audits:** Regularly run `npm audit` and address any reported vulnerabilities.

### Performance

*   **Database Indexing:** Ensure appropriate indexes are created on MongoDB collections to optimize query performance, especially for frequently queried fields (e.g., `memberId` in subscriptions, `email` in members).
*   **API Caching:** Implement caching strategies for frequently accessed data that doesn't change often.
*   **Image Optimization:** Optimize images for web delivery. The current `next.config.ts` allows remote images from `placehold.co`, which should be replaced with a proper image hosting and optimization solution for production.

### Monitoring & Logging

*   Integrate with a logging service (e.g., Winston, Pino) to capture application logs in production.
*   Set up monitoring and alerting for application performance, errors, and uptime.

## 6. Future Enhancements (Optional)

*   **Robust Authentication & Authorization:** Implement user roles (Admin, Treasurer, Event Manager, Member) and enforce access control.
*   **User Interface/Experience (UI/UX):** Further refine the UI based on the `docs/blueprint.md` for a more polished look and feel.
*   **Notifications:** Implement automated email or in-app notifications for events, dues, etc.
*   **Advanced Reporting:** Develop more comprehensive reporting features beyond simple data export.
*   **Error Handling:** Implement more granular error handling and user-friendly error messages.
*   **Testing:** Expand unit, integration, and end-to-end tests.
*   **CI/CD Pipeline:** Set up a Continuous Integration/Continuous Deployment pipeline for automated testing and deployment.
*   **Genkit AI Integration:** Explore and implement the planned AI features using Genkit.
