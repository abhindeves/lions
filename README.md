# LionsManager

LionsManager is a web application built with Next.js and MongoDB for managing a Lions Club. It provides a dashboard for tracking members, events, and subscriptions.

## Features

- **Dashboard:** An overview of the club's activities, including total members, active members, upcoming events, and outstanding dues.
- **Member Management:** Add, edit, and delete members. View a list of all members with their status, membership type, and start date.
- **Event Management:** (Coming Soon)
- **Subscription Management:** (Coming Soon)

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lions-manager.git
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=your-mongodb-connection-string
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for building user interfaces
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Genkit](https://firebase.google.com/docs/genkit) - AI integration

## Project Structure

- `src/app`: Contains the main application logic, including pages and API routes.
- `src/components`: Contains reusable UI components.
- `src/lib`: Contains utility functions and database connection logic.
- `src/services`: Contains services for interacting with the database.
- `src/ai`: Contains AI-related logic.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.