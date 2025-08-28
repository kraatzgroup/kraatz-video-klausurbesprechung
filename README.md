# Kraatz Club Web Application

A comprehensive web application for the Kraatz Club that allows participants to purchase legal case study packages, request custom case studies, submit their solutions, and receive video feedback from instructors.

## Features

- **User Authentication**: Secure registration and login with Supabase Auth
- **Package Purchase System**: Buy credits for case studies with Stripe integration
- **Case Study Request System**: Request custom case studies with dynamic legal area selection
- **File Management**: Upload solutions and download case study materials
- **Video Feedback**: Receive personalized video corrections from instructors
- **Admin Dashboard**: Instructor tools for managing case studies and corrections
- **Notification System**: Real-time notifications for status updates

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payment**: Stripe integration
- **Routing**: React Router
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kraatz-club
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. Set up the database:
- Go to your Supabase project dashboard
- Navigate to the SQL Editor
- Run the SQL script from `database/schema.sql`

5. Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000).

## Database Schema

The application uses the following main tables:
- `users` - User profiles and account credits
- `packages` - Available case study packages
- `orders` - Purchase history
- `case_study_requests` - Custom case study requests
- `submissions` - Student solution submissions
- `notifications` - User notifications

## Legal Areas Supported

- **Zivilrecht (Civil Law)**
  - BGB AT, Schuldrecht AT/BT, Sachenrecht, Familienrecht, Erbrecht
- **Strafrecht (Criminal Law)**
  - Strafrecht AT/BT, Strafverfahrensrecht
- **Öffentliches Recht (Public Law)**
  - Staatsrecht, Verwaltungsrecht AT/BT, Europarecht

## Available Scripts

### `npm start`
Runs the app in development mode on [http://localhost:3000](http://localhost:3000).

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication forms
│   └── layout/         # Layout components
├── contexts/           # React contexts (Auth)
├── data/              # Static data and configurations
├── lib/               # Utility libraries (Supabase config)
├── pages/             # Page components
└── App.tsx            # Main application component
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for the Kraatz Club.
