import { Outlet } from 'react-router';
import DeviceShell from './DeviceShell';

export default function PhoneFrameLayout() {
  return (
    <DeviceShell>
      <Outlet />
    </DeviceShell>
  );
}
