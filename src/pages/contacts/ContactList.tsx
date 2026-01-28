import { useEffect, useState } from 'react';
import { filemaker } from '../../services/filemaker';
import type { Contact } from '../../types';
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
    key: keyof Contact['fieldData'];
}

const ContactList = () => {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [foundCount, setFoundCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const PAGE_SIZE = 20;

    // Column Definitions
    const [columns, setColumns] = useState<Column[]>([
        { id: 'ussmId', label: 'USSM ID', key: 'USSMID' },
        { id: 'name', label: 'Name', key: 'ContactName' },
        { id: 'type', label: 'Type', key: 'ContactType' },
        { id: 'salesContact', label: 'Sales Contact', key: 'SalesContactName' },
        { id: 'lastSalesDate', label: 'Last Sales Date', key: 'LastSalesDate' },
    ]);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            try {
                const { data, foundCount: found } = await filemaker.getContacts(page, PAGE_SIZE, searchTerm);
                setContacts(data);
                setFoundCount(found);
                setTotalPages(Math.ceil(found / PAGE_SIZE));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
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
                <h1>Contacts</h1>
                <SearchBar onSearch={handleSearch} placeholder="Search Contacts..." />
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
                                            {columns.map((col) => (
                                                <SortableHeader key={col.id} id={col.id}>
                                                    {col.label}
                                                </SortableHeader>
                                            ))}
                                            <th style={{ width: '50px' }}>Actions</th>
                                        </tr>
                                    </SortableContext>
                                </thead>
                                <tbody>
                                    {contacts.map((contact) => (
                                        <tr key={contact.recordId}>
                                            {columns.map((col) => (
                                                <td key={col.id} style={col.id === 'name' ? { fontWeight: 500 } : {}}>
                                                    {contact.fieldData[col.key] || '-'}
                                                </td>
                                            ))}
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/contacts/${contact.recordId}`)}
                                                    style={{ color: 'hsl(var(--primary))' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {contacts.length === 0 && <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '1rem' }}>No contacts found.</td></tr>}
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

export default ContactList;
