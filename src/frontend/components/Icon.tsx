import React from 'react';

interface IconProps {
    name: string;
    className?: string;
    filled?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, className = "", filled = false }) => {
    // Material Symbols support font variation settings for fill
    const style = filled ? { fontVariationSettings: "'FILL' 1" } : {};
    return (
        <span className={`material-symbols-outlined ${className}`} style={style}>
            {name}
        </span>
    );
};