import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filemaker } from '../../services/filemaker';
import type { Sale } from '../../types';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableHeader } from '../../components/SortableHeader';

interface Column {
    id: string;
    label: string;
    key: keyof Sale['fieldData'];
}

const SalesList = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [foundCount, setFoundCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Limits
    const PAGE_SIZE = 20;

    // Column Definitions
    const [columns, setColumns] = useState<Column[]>([
        { id: 'salesKey', label: 'Sales Key', key: 'SalesKey_Display' },
        { id: 'date', label: 'Date', key: 'SalesDate' },
        { id: 'customer', label: 'Customer', key: 'ContactName_BillTo' },
        { id: 'invoiceNo', label: 'Invoice #', key: 'InvoiceNo' },
        { id: 'status', label: 'Status', key: 'SalesStatus_new' },
        { id: 'total', label: 'Total', key: 'Total_Static_Display' },
    ]);

    useEffect(() => {
        const fetchSales = async () => {
            setLoading(true);
            try {
                const { data, foundCount: found } = await filemaker.getSales(page, PAGE_SIZE, searchTerm);
                setSales(data);
                setFoundCount(found);
                setTotalPages(Math.ceil(found / PAGE_SIZE));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, [page, searchTerm]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex((c) => c.id === active.id);
                const newIndex = items.findIndex((c) => c.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1); // Reset to first page on new search
    };

    const renderCell = (sale: Sale, column: Column) => {
        const val = sale.fieldData[column.key];

        if (column.key === 'SalesStatus_new') {
            const status = val as string;
            return (
                <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    backgroundColor: status === 'Closed' ? 'hsla(var(--primary), 0.1)' : 'hsla(var(--secondary), 0.1)',
                    color: status === 'Closed' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'
                }}>
                    {status}
                </span>
            );
        }

        if (column.key === 'ContactName_BillTo') {
            return <span style={{ fontWeight: 500 }}>{val}</span>;
        }

        return val || '-';
    };

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                <h1>Sales</h1>
                <SearchBar onSearch={handleSearch} placeholder="Search Invoice # or Customer..." />
            </div>

            {loading ? (
                <div style={{ padding: 'var(--space-5)', color: 'hsl(var(--text-muted))' }}>Loading sales...</div>
            ) : (
                <>
                    <div className="table-container">
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <table>
                                <thead>
                                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                                        <tr>
                                            {columns.map((col) => (
                                                <SortableHeader key={col.id} id={col.id}>
                                                    {col.label}
                                                </SortableHeader>
                                            ))}
                                        </tr>
                                    </SortableContext>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => (
                                        <tr
                                            key={sale.recordId}
                                            style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                            onClick={() => navigate(`/sales/${sale.recordId}`)}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            {columns.map((col) => (
                                                <td key={col.id}>
                                                    {renderCell(sale, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {sales.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length} style={{ textAlign: 'center', padding: 'var(--space-5)' }}>No sales found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </DndContext>
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        foundCount={foundCount}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
};

export default SalesList;
