import Link from 'next/link';

export default function PlayerNotFound() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Player Not Found
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          The player you are looking for does not exist or could not be found.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white
                     rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Search
        </Link>
      </div>
    </main>
  );
}
