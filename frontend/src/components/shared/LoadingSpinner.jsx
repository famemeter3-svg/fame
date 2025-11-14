/**
 * LoadingSpinner component
 * Displays a rotating spinner with optional message
 */

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-light-bg-secondary rounded-full dark:border-dark-bg-secondary"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary font-body">
        {message}
      </p>
    </div>
  );
}
