import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
    foundCount?: number;
}

const Pagination = ({ page, totalPages, onPageChange, foundCount }: PaginationProps) => {
    return (
        <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Page {page} of {totalPages} {foundCount !== undefined && `(${foundCount} records)`}
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: 'hsl(var(--text-main))',
                        color: 'hsl(var(--bg-body))',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        opacity: page <= 1 ? 0.5 : 1,
                        cursor: page <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        transition: 'var(--transition)'
                    }}
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: 'hsl(var(--text-main))',
                        color: 'hsl(var(--bg-body))',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        opacity: page >= totalPages ? 0.5 : 1,
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        transition: 'var(--transition)'
                    }}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
