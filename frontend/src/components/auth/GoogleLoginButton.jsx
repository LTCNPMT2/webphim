import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../services/api.js';

export default function GoogleLoginButton({ onSuccess, className = '' }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef(null);

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;
    const initClient = () => {
      if (!window.google?.accounts?.oauth2 || !isMounted) return;

      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                toast.error('Đăng nhập Google thất bại: ' + tokenResponse.error);
              }
              return;
            }
            try {
              await loginWithGoogle({ access_token: tokenResponse.access_token });
              toast.success('Đăng nhập bằng tài khoản Google thành công!');
              if (onSuccess) onSuccess();
            } catch (err) {
              toast.error(getErrorMessage(err) || 'Đăng nhập Google thất bại');
            } finally {
              setLoading(false);
            }
          },
        });
      } catch (err) {
        console.warn('Google OAuth client init warning:', err);
      }
    };

    let script = document.getElementById('google-gsi-client');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initClient;
      document.body.appendChild(script);
    } else {
      initClient();
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, loginWithGoogle, onSuccess]);

  const handleGoogleClick = () => {
    if (!clientId) {
      toast.error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong .env');
      return;
    }

    if (tokenClientRef.current) {
      setLoading(true);
      // Mở cửa sổ popup chọn tài khoản Google chuẩn của trình duyệt
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      // Thử khởi tạo lại nếu script vừa tải xong
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                setLoading(false);
                return;
              }
              try {
                await loginWithGoogle({ access_token: tokenResponse.access_token });
                toast.success('Đăng nhập bằng tài khoản Google thành công!');
                if (onSuccess) onSuccess();
              } catch (err) {
                toast.error(getErrorMessage(err) || 'Đăng nhập Google thất bại');
              } finally {
                setLoading(false);
              }
            },
          });
          setLoading(true);
          tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (e) {
          console.error(e);
        }
      }
      toast.error('Đang kết nối dịch vụ Google, vui lòng thử lại sau vài giây');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={loading}
      className={`group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-black/40 transition-all hover:bg-slate-100 hover:shadow-2xl hover:shadow-white/10 active:scale-[0.99] disabled:opacity-60 cursor-pointer ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2.5 text-slate-800">
          <svg className="h-4 w-4 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Đang kết nối Google...</span>
        </span>
      ) : (
        <>
          <svg className="h-5 w-5 shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="tracking-wide text-slate-900 font-semibold">Tiếp tục với Google</span>
        </>
      )}
    </button>
  );
}
