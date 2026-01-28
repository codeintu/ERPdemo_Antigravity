import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filemaker } from '../../services/filemaker';
import type { Product, Lot } from '../../types';
import Card from '../../components/Card';
import { ArrowLeft, Package, Tag, Layers, Box } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableHeader } from '../../components/SortableHeader';

interface LotColumn {
    id: string;
    label: string;
    key: keyof Lot['fieldData'];
}

const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);

    // Lot Portal Columns
    const [lotColumns, setLotColumns] = useState<LotColumn[]>([
        { id: 'serial', label: 'Lot No / Serial', key: 'SerialNo' },
        { id: 'warehouse', label: 'Warehouse', key: 'WarehouseName' },
        { id: 'qtyAll', label: 'Qty All', key: 'LotNo_QtyAll' },
        { id: 'qtyUsed', label: 'Qty Used', key: 'LotNo_QtyUsed' },
        { id: 'inventory', label: 'Current Inventory', key: 'LotNo_CurrentInventory_Static' },
        { id: 'mfgDate', label: 'Mfg Date', key: 'MfgDate' },
        { id: 'expDate', label: 'Exp Date', key: 'ExpDate' },
        { id: 'status', label: 'Status', key: 'INVTransferStatus' },
        { id: 'cost', label: 'Cost', key: 'Cost' },
    ]);

    const handleLotDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLotColumns((items) => {
                const oldIndex = items.findIndex((c) => c.id === active.id);
                const newIndex = items.findIndex((c) => c.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const productData = await filemaker.getProduct(id);
                setProduct(productData);

                if (productData && productData.fieldData.ItemNo) {
                    const lotsData = await filemaker.getLots(productData.fieldData.ItemNo);
                    setLots(lotsData);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!product) return <div>Product not found</div>;

    return (
        <div>
            <button
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 text-muted"
                style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
            >
                <ArrowLeft size={16} /> Back to Products
            </button>

            <div style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <Card title="Product Details">
                    <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-5)' }}>
                        <div style={{
                            width: '64px', height: '64px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'hsla(var(--secondary), 0.1)',
                            color: 'hsl(var(--secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Package size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>{product.fieldData.ProductName}</h1>
                            <div className="flex items-center gap-2">
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'hsla(var(--primary), 0.1)',
                                    color: 'hsl(var(--primary))',
                                    fontSize: '0.75rem'
                                }}>
                                    {product.fieldData.ProductCategory || 'Uncategorized'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Item No</div>
                                <div>{product.fieldData.ItemNo || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Box size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Pack Size</div>
                                <div>{product.fieldData.DefaultPackSize || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Layers size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Unit Type</div>
                                <div>{product.fieldData.UnitType || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Inventory</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{product.fieldData.CurrentInventory_w || 0}</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>Related Lots</h3>
                <div className="table-container">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleLotDragEnd}>
                        <table>
                            <thead>
                                <SortableContext items={lotColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                                    <tr>
                                        {lotColumns.map((col) => (
                                            <SortableHeader key={col.id} id={col.id}>
                                                {col.label}
                                            </SortableHeader>
                                        ))}
                                    </tr>
                                </SortableContext>
                            </thead>
                            <tbody>
                                {lots.map((lot) => (
                                    <tr key={lot.recordId}>
                                        {lotColumns.map((col) => (
                                            <td key={col.id} style={col.id === 'serial' ? { fontWeight: 500 } : {}}>
                                                {lot.fieldData[col.key] || (lot.fieldData[col.key] === 0 ? 0 : '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {lots.length === 0 && (
                                    <tr>
                                        <td colSpan={lotColumns.length} style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
                                            No related lots found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
