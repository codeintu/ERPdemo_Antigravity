import { useEffect, useState } from 'react';
import { filemaker } from '../services/filemaker';
import type { Sale } from '../types';
import Card from '../components/Card';
import { DollarSign, Calendar, FileText, Clock, RefreshCcw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type AggregationLevel = 'daily' | 'monthly' | 'yearly';

const Dashboard = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    // UI Date State (Inputs)
    const [uiStartDate, setUiStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [uiEndDate, setUiEndDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    // Active Date State (Fetching)
    const [activeDateRange, setActiveDateRange] = useState({ start: uiStartDate, end: uiEndDate });

    // Helper to format date for display (MM/DD/YYYY)
    const formatDateForAPI = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
    };

    const formatDateForHeader = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
    };

    useEffect(() => {
        const fetchSales = async () => {
            setLoading(true);
            try {
                const apiStart = formatDateForAPI(activeDateRange.start);
                const apiEnd = formatDateForAPI(activeDateRange.end);

                // Using page=1, limit=5000 to get all data for aggregation
                const { data } = await filemaker.getSales(1, 5000, '', apiStart, apiEnd);
                setSales(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (activeDateRange.start && activeDateRange.end) {
            fetchSales();
        }
    }, [activeDateRange]);

    const handleReload = () => {
        setActiveDateRange({ start: uiStartDate, end: uiEndDate });
    };

    // Helper to parse currency string "5,221.00" -> 5221.00
    const parseCurrency = (str: string) => {
        if (!str) return 0;
        return parseFloat(str.replace(/,/g, ''));
    };

    // --- Aggregation Logic ---

    const getAggregationLevel = (start: string, end: string): AggregationLevel => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 60) return 'daily';
        if (diffDays <= 730) return 'monthly'; // approx 2 years
        return 'yearly';
    };

    const aggregationLevel = getAggregationLevel(activeDateRange.start, activeDateRange.end);

    const processChartData = (sales: Sale[], level: AggregationLevel) => {
        const totals: Record<string, number> = {};

        sales.forEach(s => {
            if (s.fieldData.SalesStatus_new === 'Closed') {
                const dateParts = s.fieldData.SalesDate.split('/'); // MM/DD/YYYY
                if (dateParts.length !== 3) return;

                const month = dateParts[0].padStart(2, '0');
                const day = dateParts[1].padStart(2, '0');
                const year = dateParts[2];
                const isoDate = `${year}-${month}-${day}`; // YYYY-MM-DD for sorting

                let key = isoDate;
                if (level === 'monthly') key = `${year}-${month}`;
                if (level === 'yearly') key = `${year}`;

                totals[key] = (totals[key] || 0) + parseCurrency(s.fieldData.Total_Static_Display);
            }
        });

        return Object.entries(totals)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));
    };

    const chartData = processChartData(sales, aggregationLevel);

    // Filter KPI data roughly by fetched range (API handles this, but ensuring consistency)
    const invoicedSales = sales.filter(s => s.fieldData.SalesStatus_new === 'Closed');
    const openSales = sales.filter(s => s.fieldData.SalesStatus_new !== 'Closed');
    const totalInvoicedRevenue = invoicedSales.reduce((acc, curr) => acc + parseCurrency(curr.fieldData.Total_Static_Display), 0);

    // Pie Chart Data
    const statusDataRaw: Record<string, number> = {};
    sales.forEach(s => {
        const status = s.fieldData.SalesStatus_new || 'Unknown';
        statusDataRaw[status] = (statusDataRaw[status] || 0) + 1;
    });
    const pieData = Object.entries(statusDataRaw).map(([name, value]) => ({ name, value }));

    // Formatter for Axis/Tooltip based on aggregation
    const formatDateLabel = (val: string) => {
        if (!val) return '';
        if (aggregationLevel === 'daily') {
            const [, m, d] = val.split('-');
            return `${m}/${d}`;
        }
        if (aggregationLevel === 'monthly') {
            const [y, m] = val.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        return val; // yearly is just YYYY
    };

    return (
        <div style={{ paddingBottom: 'var(--space-6)' }}>
            {/* Header with Date Range */}
            <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1>Sales Overview</h1>
                    <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                        {activeDateRange.start && activeDateRange.end ? `${formatDateForHeader(activeDateRange.start)} - ${formatDateForHeader(activeDateRange.end)}` : 'Select a date range'}
                        <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: 'hsl(var(--bg-card-hover))', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {aggregationLevel.charAt(0).toUpperCase() + aggregationLevel.slice(1)} View
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <div className="flex gap-2 items-center" style={{ backgroundColor: 'hsl(var(--bg-card))', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <Calendar size={18} color="white" />
                        <input
                            type="date"
                            value={uiStartDate}
                            onChange={(e) => setUiStartDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                        />
                        <span className="text-muted">-</span>
                        <input
                            type="date"
                            value={uiEndDate}
                            onChange={(e) => setUiEndDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                        />
                    </div>
                    <button
                        onClick={handleReload}
                        className="btn-primary"
                        style={{ padding: '8px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Reload Data"
                    >
                        <RefreshCcw size={18} color="white" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>Loading dashboard data...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                        <Card title="Total Invoiced">
                            <div className="flex items-center gap-4">
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalInvoicedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Actually Invoiced</div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Order Stats">
                            <div className="flex justify-between items-center h-full">
                                <div className="text-center">
                                    <div className="text-muted flex items-center justify-center gap-1" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                                        <FileText size={14} /> Total
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{sales.length}</div>
                                </div>
                                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-color)' }}></div>
                                <div className="text-center">
                                    <div className="text-muted flex items-center justify-center gap-1" style={{ fontSize: '0.75rem', marginBottom: '4px', color: 'hsl(var(--primary))' }}>
                                        <DollarSign size={14} /> Invoiced
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>{invoicedSales.length}</div>
                                </div>
                                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-color)' }}></div>
                                <div className="text-center">
                                    <div className="text-muted flex items-center justify-center gap-1" style={{ fontSize: '0.75rem', marginBottom: '4px', color: 'hsl(var(--secondary))' }}>
                                        <Clock size={14} /> Open
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--secondary))' }}>{openSales.length}</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Row 1: Bar Chart + Pie Chart */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                        <Card title={`Revenue (${aggregationLevel.charAt(0).toUpperCase() + aggregationLevel.slice(1)})`}>
                            <div style={{ height: '300px', width: '100%', marginTop: 'var(--space-4)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDateLabel}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
                                            tickFormatter={(val) => `$${val / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}
                                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                                            labelFormatter={(label) => formatDateLabel(label)}
                                        />
                                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Order Status Distribution">
                            <div style={{ height: '300px', width: '100%', marginTop: 'var(--space-4)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Row 2: Line Chart */}
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <Card title="Revenue Trend">
                            <div style={{ height: '350px', width: '100%', marginTop: 'var(--space-4)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDateLabel}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
                                            tickFormatter={(val) => `$${val / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}
                                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                                            labelFormatter={(label) => formatDateLabel(label)}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="hsl(var(--secondary))"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: 'hsl(var(--bg-card))', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
