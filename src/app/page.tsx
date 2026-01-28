export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
          Bacau Scout
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          Football Scouting Tool
        </p>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Supabase connection will be configured
          </p>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Database: fuubyhubptalxwondwov.supabase.co
          </p>
        </div>
      </main>
    </div>
  );
}
