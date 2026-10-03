import Link from 'next/link';

export default function ServerDataError({ message }: { message: string }) {
  return (
    <div role="alert" className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Server data unavailable</h1>
      <p className="text-red-300">{message}</p>
      <div className="flex flex-wrap gap-6">
        <Link href="/servers" className="text-cyan-300 hover:underline">Back to servers</Link>
        <a href="/auth/login" className="text-cyan-300 hover:underline">Sign in again</a>
      </div>
    </div>
  );
}
