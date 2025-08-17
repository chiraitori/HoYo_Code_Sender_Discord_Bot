'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ServerPicker from '../../components/ServerPicker';

function ServerPickerContent() {
  const searchParams = useSearchParams();
  const authStatus = searchParams.get('auth');

  return (
    <div>
      {authStatus === 'success' && (
        <div className="fixed top-4 right-4 bg-green-500/20 border border-green-400 text-green-200 px-4 py-2 rounded-lg z-50">
          ✅ Successfully logged in with Discord!
        </div>
      )}
      <ServerPicker />
    </div>
  );
}

export default function ServerPickerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-purple-950 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      <ServerPickerContent />
    </Suspense>
  );
}
