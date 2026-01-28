import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: '240px', // Width of sidebar
                padding: 'var(--space-5)',
                backgroundColor: 'hsl(var(--bg-body))'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
