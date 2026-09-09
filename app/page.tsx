import { redirect } from 'next/navigation';

/**
 * Root route — always redirect to /login.
 * After sign-in, the login page will forward the user to /dashboard.
 */
export default function RootPage() {
  redirect('/login');
}
