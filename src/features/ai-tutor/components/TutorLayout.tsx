import { Outlet } from 'react-router-dom';
import { useRef } from 'react';
import { TutorTopTabs } from './TutorTopTabs';
import { TutorFooterNav } from './TutorFooterNav';
import { unlockAudioOnGesture } from '../audio/audioUtils';

/**
 * Top-level layout for all /ai-tutor/* routes.
 *
 * - Sticky top tab strip + sticky bottom nav, with <Outlet /> for the page.
 * - The first user click anywhere in the layout calls unlockAudioOnGesture()
 *   so subsequent TTS / waveform playback works on iOS Safari and other
 *   browsers that gate AudioContext on user gesture. We guard with a ref so
 *   we only fire the unlock once per mount.
 */
export function TutorLayout() {
  const unlockedRef = useRef(false);

  const handleFirstClick = () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    unlockAudioOnGesture();
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-gray-950"
      onClick={handleFirstClick}
    >
      <TutorTopTabs />
      <main className="flex-1 pb-24 pt-2 px-4 max-w-2xl w-full mx-auto">
        <Outlet />
      </main>
      <TutorFooterNav />
    </div>
  );
}

export default TutorLayout;
