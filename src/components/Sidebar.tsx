import { NavLink } from 'react-router-dom';
import { Users, Package, LayoutDashboard, DollarSign } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Contacts', path: '/contacts', icon: Users },
        { name: 'Products', path: '/products', icon: Package },
        { name: 'Sales', path: '/sales', icon: DollarSign },
    ];

    return (
        <aside style={{
            width: '240px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRight: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-4)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0
        }}>
            <div style={{ marginBottom: 'var(--space-5)', paddingLeft: 'var(--space-2)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>Nexus ERP</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? 'nav-item active' : 'nav-item'
                        }
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                            backgroundColor: isActive ? 'hsla(var(--primary), 0.1)' : 'transparent',
                            transition: 'var(--transition)',
                            fontWeight: isActive ? 500 : 400,
                        })}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
