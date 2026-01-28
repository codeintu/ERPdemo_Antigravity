import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filemaker } from '../../services/filemaker';
import type { Contact } from '../../types';
import Card from '../../components/Card';
import { ArrowLeft, User, Mail, Phone, Briefcase } from 'lucide-react';

const ContactDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContact = async () => {
            if (!id) return;
            try {
                const data = await filemaker.getContact(id);
                setContact(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchContact();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!contact) return <div>Contact not found</div>;

    return (
        <div>
            <button
                onClick={() => navigate('/contacts')}
                className="flex items-center gap-2 text-muted"
                style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
            >
                <ArrowLeft size={16} /> Back to Contacts
            </button>

            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '2fr 1fr' }}>
                <Card title="Contact Information">
                    <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-5)' }}>
                        <div style={{
                            width: '64px', height: '64px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'hsla(var(--primary), 0.1)',
                            color: 'hsl(var(--primary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>
                                {contact.fieldData.ContactName}
                            </h1>
                            <div className="text-muted">{contact.fieldData.USSMID}</div>
                        </div>
                    </div>

                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        <div className="flex items-center gap-2">
                            <Briefcase size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Type</div>
                                <div>{contact.fieldData.ContactType || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <User size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Sales Contact</div>
                                <div>{contact.fieldData.SalesContactName || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Mail size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Sales Email</div>
                                <div>{contact.fieldData.SalesContactEmail || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Phone size={18} className="text-muted" />
                            <div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Sales Phone</div>
                                <div>{contact.fieldData.SalesContactPhone || '-'}</div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Notes">
                    <p className="text-muted">No notes available.</p>
                </Card>
            </div>
        </div>
    );
};

export default ContactDetail;
