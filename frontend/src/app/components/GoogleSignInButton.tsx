import { useEffect, useRef, useState } from 'react';
import { renderGoogleButton } from '../lib/googleAuth';

interface GoogleSignInButtonProps {
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onCredential: (credential: string) => void;
}

export default function GoogleSignInButton({
  disabled = false,
  text = 'continue_with',
  onCredential,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState('');

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let mounted = true;

    async function mountButton() {
      if (!containerRef.current) return;

      try {
        setError('');
        await renderGoogleButton(containerRef.current, (credential) => onCredentialRef.current(credential), {
          text,
          width: Math.min(containerRef.current.offsetWidth || 384, 400),
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Google Login gagal dimuat');
        }
      }
    }

    mountButton();

    return () => {
      mounted = false;
    };
  }, [text]);

  return (
    <div className="mb-6">
      <div className={disabled ? 'pointer-events-none opacity-60' : ''} ref={containerRef} />
      {error && (
        <div className="mt-3 rounded-lg border border-[#EF4444] bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">
          {error}
        </div>
      )}
    </div>
  );
}
