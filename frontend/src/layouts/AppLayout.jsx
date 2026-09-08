import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StoreSelect from '../components/StoreSelect';
import BrandMark from '../components/BrandMark';
import {
  HomeIcon,
  BoxIcon,
  HistoryIcon,
  ChartIcon,
  StoreIcon,
  UsersIcon,
  TagIcon,
  UserIcon,
  PlusIcon,
  LogoutIcon,
} from '../components/Icons';

const OWNER_LINKS = [
  { to: '/owner', label: 'Beranda', icon: HomeIcon, end: true },
  { to: '/owner/stok', label: 'Stok', icon: BoxIcon },
  { to: '/owner/riwayat', label: 'Riwayat', icon: HistoryIcon },
  { to: '/owner/laporan', label: 'Laporan', icon: ChartIcon },
  { to: '/owner/barang', label: 'Barang', icon: TagIcon },
  { to: '/owner/toko', label: 'Toko', icon: StoreIcon },
  { to: '/owner/staf', label: 'Staf', icon: UsersIcon },
];

const OWNER_BOTTOM = [
  { to: '/owner', label: 'Beranda', icon: HomeIcon, end: true },
  { to: '/owner/stok', label: 'Stok', icon: BoxIcon },
  { to: '/owner/catat', label: '', icon: PlusIcon, fab: true },
  { to: '/owner/riwayat', label: 'Riwayat', icon: HistoryIcon },
  { to: '/owner/laporan', label: 'Laporan', icon: ChartIcon },
];

const STAFF_LINKS = [
  { to: '/staf', label: 'Beranda', icon: HomeIcon, end: true },
  { to: '/staf/stok', label: 'Stok', icon: BoxIcon },
  { to: '/staf/riwayat', label: 'Riwayat', icon: HistoryIcon },
  { to: '/staf/profil', label: 'Profil', icon: UserIcon },
];

const STAFF_BOTTOM = [
  { to: '/staf', label: 'Beranda', icon: HomeIcon, end: true },
  { to: '/staf/stok', label: 'Stok', icon: BoxIcon },
  { to: '/staf/catat', label: '', icon: PlusIcon, fab: true },
  { to: '/staf/riwayat', label: 'Riwayat', icon: HistoryIcon },
  { to: '/staf/profil', label: 'Profil', icon: UserIcon },
];

export default function AppLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sideLinks = role === 'owner' ? OWNER_LINKS : STAFF_LINKS;
  const bottomLinks = role === 'owner' ? OWNER_BOTTOM : STAFF_BOTTOM;

  const storeName = role === 'staff' ? user?.store?.name : user?.businessName;

  function handleLogout() {
    logout();
    navigate('/masuk');
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark />
        <nav>
          {sideLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `app-sidebar__link${isActive ? ' active' : ''}`}
            >
              <l.icon width={19} height={19} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button className="app-sidebar__link" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <LogoutIcon width={19} height={19} />
            Keluar
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <div className="app-topbar__title">Halo, {user?.name?.split(' ')[0]}</div>
            {storeName && <div className="app-topbar__subtitle">{storeName}</div>}
          </div>
          {role === 'owner' && <StoreSelect />}
        </header>

        <Outlet />

        <nav className="bottom-nav">
          {bottomLinks.map((l) =>
            l.fab ? (
              <NavLink key={l.to} to={l.to} className="bottom-nav__fab" style={{ textDecoration: 'none' }}>
                <l.icon width={26} height={26} stroke="white" />
              </NavLink>
            ) : (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span className="bottom-nav__icon">
                  <l.icon />
                </span>
                {l.label}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </div>
  );
}
