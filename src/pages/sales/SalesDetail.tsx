import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filemaker } from '../../services/filemaker';
import type { Sale, LineItem, Product } from '../../types';
import { ArrowLeft, Clipboard, Users, Warehouse, X, Package, Tag, Layers, DollarSign } from 'lucide-react';
import Card from '../../components/Card';

const SalesDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sale, setSale] = useState<Sale | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const saleData = await filemaker.getSale(id);
                setSale(saleData);

                if (saleData && saleData.fieldData.SalesKeyProducts) {
                    const lines = await filemaker.getLineItems(saleData.fieldData.SalesKeyProducts);
                    setLineItems(lines);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleItemClick = async (itemNo: string) => {
        setModalLoading(true);
        setIsModalOpen(true);
        try {
            const product = await filemaker.getProductByItemNo(itemNo);
            setSelectedProduct(product);
        } catch (error) {
            console.error('Failed to fetch product details', error);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading sales details...</div>;
    if (!sale) return <div className="p-6">Sale not found.</div>;

    const fd = sale.fieldData;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--space-4)' }}>
            <button
                onClick={() => navigate('/sales')}
                className="flex items-center gap-2 text-muted hover:text-main mb-6 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <ArrowLeft size={20} />
                Back to Sales
            </button>

            {/* Top Header Section */}
            <div className="flex justify-between items-center mb-10 bg-card p-6 rounded-xl border border-border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold">
                        Sales Key #{fd.SalesKey_Display}
                        <span className="text-xl font-normal text-muted ml-2">({fd.SalesStatus_new})</span>
                    </h1>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted mb-1">Total Order Value</div>
                    <div className="text-4xl font-black text-primary">
                        ${parseFloat(fd.Total_Static_Display?.replace(/,/g, '') || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Main Details Panel - Forced Side by Side Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {/* LEFT: Customer Details Card */}
                <Card title="Customer Details">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">USSM ID</div>
                                <div className="font-medium text-sm">{fd.UssmID || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Bill To Name</div>
                                <div className="font-medium text-sm">{fd.ContactName_BillTo || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Billing Address</div>
                                <div className="bg-muted/20 p-2 rounded border border-border/40 text-[13px] leading-snug whitespace-pre-wrap min-h-[60px]">
                                    {fd.Contact_BillToNameAddressBlock_Display || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Shipping Address</div>
                                <div className="bg-muted/20 p-2 rounded border border-border/40 text-[13px] leading-snug whitespace-pre-wrap min-h-[60px]">
                                    {fd.Contact_ShipToNameAddressBlock_Display || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* RIGHT: Order Details Card */}
                <Card title="Order Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Invoice No</div>
                            <div className="font-bold text-base text-main">{fd.InvoiceNo || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">PO Number</div>
                            <div className="font-medium text-sm">{fd.PONumber || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Sales Date</div>
                            <div className="font-medium text-sm">{fd.SalesDate || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Invoice Date</div>
                            <div className="font-medium text-sm">{fd.InvoiceDate || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Order Entered</div>
                            <div className="font-medium text-sm">{fd.OrderEnteredDate || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Warehouse</div>
                            <div className="font-medium text-sm flex items-center gap-1">
                                <Warehouse size={12} className="text-muted" /> {fd.Shipping_WarehouseName || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Sold By</div>
                            <div className="font-medium text-sm flex items-center gap-1">
                                <Users size={12} className="text-muted" /> {fd.StaffName_SoldBy || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Processed By</div>
                            <div className="font-medium text-sm">{fd.OrderProcessedBy || 'N/A'}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <Card title={`Order Line Items (${lineItems.length})`}>
                    <div className="table-container mt-4">
                        <table style={{ minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>S.No</th>
                                    <th style={{ textAlign: 'left', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item No</th>
                                    <th style={{ textAlign: 'left', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                    <th style={{ textAlign: 'left', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serial No</th>
                                    <th style={{ textAlign: 'right', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Qty</th>
                                    <th style={{ textAlign: 'left', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Unit</th>
                                    <th style={{ textAlign: 'right', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                                    <th style={{ textAlign: 'right', padding: '16px 12px', borderBottom: '2px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item, index) => (
                                    <tr key={item.recordId} className="hover:bg-muted/20 transition-colors">
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)', color: 'hsl(var(--text-muted))' }}>{index + 1}</td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>
                                            <button
                                                onClick={() => handleItemClick(item.fieldData.ItemNo)}
                                                className="font-bold text-primary hover:underline"
                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                                            >
                                                {item.fieldData.ItemNo}
                                            </button>
                                        </td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{item.fieldData.ProductDescription}</td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            {item.fieldData.SerialNo || <span className="text-muted italic opacity-50">-</span>}
                                        </td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>{item.fieldData.Quantity}</td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium uppercase">{item.fieldData.UnitType}</span>
                                        </td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>${item.fieldData.PriceOfSale?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 'bold' }}>${item.fieldData.LinePrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {lineItems.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted italic">
                                            <Clipboard size={48} className="mx-auto mb-2 opacity-20" />
                                            No line items found for this order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Product Detail Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-4)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxWidth: '500px',
                        width: '100%',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: 'var(--space-3)',
                            borderBottom: '1px solid hsl(var(--border))',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)'
                        }}>
                            <h3 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Package size={18} className="text-primary" />
                                Product Details Master
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setSelectedProduct(null);
                                }}
                                style={{ padding: '6px', cursor: 'pointer', borderRadius: '50%' }}
                                className="hover-bg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: 'var(--space-6)' }}>
                            {modalLoading ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '3px solid hsl(var(--primary) / 0.1)',
                                        borderTopColor: 'hsl(var(--primary))',
                                        borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    Fetching product details...
                                </div>
                            ) : selectedProduct ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ backgroundColor: 'hsla(var(--primary), 0.1)', padding: '12px', borderRadius: '12px' }}>
                                            <Package size={32} className="text-primary" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Item Number</div>
                                            <div style={{ fontSize: '24px', fontWeight: '900' }}>{selectedProduct.fieldData.ItemNo}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                                            <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clipboard size={12} /> Product Name
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedProduct.fieldData.ProductName || 'N/A'}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                                                <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Tag size={12} /> Category
                                                </div>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedProduct.fieldData.ProductCategory || 'N/A'}</div>
                                            </div>
                                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                                                <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Layers size={12} /> Inventory
                                                </div>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px' }} className="text-primary">
                                                    {selectedProduct.fieldData.CurrentInventory_w || '0'} {selectedProduct.fieldData.UnitType}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            backgroundColor: 'hsla(var(--primary), 0.05)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid hsla(var(--primary), 0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <DollarSign size={18} className="text-primary" />
                                                <span style={{ fontSize: '14px', fontWeight: '500' }}>Standard Cost</span>
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: '900' }} className="text-primary">
                                                ${parseFloat(String(selectedProduct.fieldData.ProductCost_c || '0')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                                    Product not found in master records.
                                </div>
                            )}
                        </div>

                        <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(0, 0, 0, 0.1)', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    padding: '8px 24px',
                                    backgroundColor: 'hsl(var(--primary))',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesDetail;
