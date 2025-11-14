import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary">
      <Header isAdmin />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-display font-bold text-light-text-primary dark:text-dark-text-primary mb-8">
          Admin Dashboard
        </h1>
        <LoadingSpinner message="Loading dashboard..." />
      </main>
    </div>
  );
}
