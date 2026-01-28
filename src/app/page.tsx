import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="py-8 text-center border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          Bacau Scout
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Football Scouting Tool
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <SearchBar />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
        <p>Search 750+ players from Transfermarkt data</p>
      </footer>
    </div>
  );
}
