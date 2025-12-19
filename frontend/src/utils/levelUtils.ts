export const getLevelName = (level: number | string): string => {
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    switch (lvl) {
        case 1: return 'Silver';
        case 2: return 'Gold';
        case 3: return 'Platinum';
        case 4: return 'Diamond';
        default: return `Level ${lvl}`;
    }
};

export const getLevelColor = (level: number | string): string => {
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    switch (lvl) {
        case 1: return 'text-gray-400'; // Silver
        case 2: return 'text-yellow-400'; // Gold
        case 3: return 'text-cyan-400'; // Platinum (Cyan-ish)
        case 4: return 'text-blue-200'; // Diamond (Sparkle Blue)
        default: return 'text-white';
    }
};
