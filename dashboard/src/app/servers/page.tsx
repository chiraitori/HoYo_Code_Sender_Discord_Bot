'use client';

import { useSearchParams } from 'next/navigation';
import ServerPicker from '../../components/ServerPicker';

export default function ServerPickerPage() {
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
