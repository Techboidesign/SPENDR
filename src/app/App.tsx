import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useDeviceShell } from './hooks/useDeviceShell';

export default function App() {
  const native = useDeviceShell();

  return (
    <div
      style={{
        minHeight: '100vh',
        height: native ? '100dvh' : undefined,
        display: 'flex',
        alignItems: native ? 'stretch' : 'center',
        justifyContent: 'center',
        backgroundColor: native ? 'var(--app-shell-native)' : 'var(--app-shell-outer)',
      }}
    >
      <RouterProvider router={router} />
    </div>
  );
}
