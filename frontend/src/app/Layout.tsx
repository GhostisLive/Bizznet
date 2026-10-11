import { Outlet } from 'react-router-dom';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function Layout() {
  return (
    <>
      <Nav />
      <main className="pt-16 flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}