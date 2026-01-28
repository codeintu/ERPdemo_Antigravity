import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableHeaderProps {
    id: string;
    children: React.ReactNode;
    style?: CSSProperties; // Use the imported CSSProperties type
}

export const SortableHeader = ({ id, children, style }: SortableHeaderProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const combinedStyle: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'move',
        userSelect: 'none',
        ...style,
    };

    return (
        <th ref={setNodeRef} style={combinedStyle} {...attributes} {...listeners}>
            {children}
        </th>
    );
};
