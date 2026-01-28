import { useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
    onSearch: (term: string) => void;
    placeholder?: string;
}

const SearchBar = ({ onSearch, placeholder = 'Search...' }: SearchBarProps) => {
    const [value, setValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch(value);
        }
    };

    return (
        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'hsl(var(--bg-card))',
                    color: 'inherit'
                }}
            />
        </div>
    );
};

export default SearchBar;
