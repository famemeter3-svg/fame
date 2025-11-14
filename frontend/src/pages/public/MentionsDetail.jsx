import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';

export default function MentionsDetail() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingSpinner message="Loading mentions..." />
      </main>
    </div>
  );
}
