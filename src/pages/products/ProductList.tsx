import { useEffect, useState } from 'react';
import { filemaker } from '../../services/filemaker';
import type { Product } from '../../types';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableHeader } from '../../components/SortableHeader';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

interface Column {
    id: string;
    label: string;
    key: keyof Product['fieldData'];
}

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [foundCount, setFoundCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const PAGE_SIZE = 20;

    // Column Definitions
    const [columns, setColumns] = useState<Column[]>([
        { id: 'itemNo', label: 'Item No', key: 'ItemNo' },
        { id: 'name', label: 'Item Description', key: 'ProductName' },
        { id: 'packSize', label: 'Pack Size', key: 'DefaultPackSize' },
        { id: 'unitType', label: 'Pack Type', key: 'UnitType' },
    ]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, foundCount: found } = await filemaker.getProducts(page, PAGE_SIZE, searchTerm);
                setProducts(data);
                setFoundCount(found);
                setTotalPages(Math.ceil(found / PAGE_SIZE));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
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
        setPage(1);
    };

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                <h1>Products</h1>
                <SearchBar onSearch={handleSearch} placeholder="Search Products..." />
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div className="table-container">
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <table>
                                <thead>
                                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                                        <tr>
                                            <th style={{ width: '50px' }}></th>
                                            {columns.map((col) => (
                                                <SortableHeader key={col.id} id={col.id}>
                                                    {col.label}
                                                </SortableHeader>
                                            ))}
                                        </tr>
                                    </SortableContext>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr
                                            key={product.recordId}
                                            onClick={() => navigate(`/products/${product.recordId}`)}
                                            style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-card-hover))')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <td>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/products/${product.recordId}`);
                                                    }}
                                                    style={{ color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                            {columns.map((col) => (
                                                <td key={col.id} style={col.id === 'itemNo' ? { fontWeight: 500 } : {}}>
                                                    {product.fieldData[col.key] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {products.length === 0 && <tr><td colSpan={columns.length + 1} className="text-center p-4">No products found.</td></tr>}
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

export default ProductList;
