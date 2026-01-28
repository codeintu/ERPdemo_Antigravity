interface CardProps {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
    className?: string;
}

const Card = ({ children, title, action, className = '' }: CardProps) => {
    return (
        <div
            className={className}
            style={{
                backgroundColor: 'hsl(var(--bg-card))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--border))',
                padding: 'var(--space-5)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
        >
            {(title || action) && (
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                    {title && <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
};

export default Card;
