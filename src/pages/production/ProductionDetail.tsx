import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProductionDetail = () => {
    const navigate = useNavigate();
    return (
        <div>
            <button
                onClick={() => navigate('/production')}
                className="flex items-center gap-2 text-muted"
                style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
            >
                <ArrowLeft size={16} /> Back to Production
            </button>
            <h1>Production Detail</h1>
            <p>Coming soon.</p>
        </div>
    );
};
export default ProductionDetail;
