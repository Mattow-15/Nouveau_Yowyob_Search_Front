import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types/search';

interface ResultListItemProps {
    item: SearchResult;
    onClick?: (item: SearchResult) => void;
}

export const ResultListItem: React.FC<ResultListItemProps> = ({ item, onClick }) => {

    // Generate a display URL or breadcrumb
    const displayUrl = item.detailsUrl && item.detailsUrl.startsWith('http')
        ? item.detailsUrl.replace('https://', '').replace('http://', '').split('/')[0]
        : `yowyob.com › ${item.category || item.type} › ${item.id.substring(0, 8)}`;

    return (
        <div
            className="group flex flex-col md:flex-row gap-4 mb-8 max-w-2xl cursor-pointer"
            onClick={() => onClick?.(item)}
        >
            <div className="flex-1 min-w-0">
                {/* 1. Header: Icon + Site/Breadcrumb */}
                <div className="flex items-center gap-3 mb-1.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        {item.type.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-200 text-sm leading-tight">YowYob Search</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs truncate leading-tight">{displayUrl}</span>
                    </div>
                </div>

                {/* 2. Title: Blue, Large, Hover Underline */}
                <h3 className="text-xl text-[#1a0dab] dark:text-[#8ab4f8] font-normal group-hover:underline mb-1 leading-snug">
                    {item.name}
                </h3>

                {/* 3. Rich Snippets Row (Rating, Price, etc.) */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
                    {item.rating > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="text-yellow-500 text-xs">★★★★★</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.rating.toFixed(1)}</span>
                        </div>
                    )}
                    {item.price && (
                        <span className="font-semibold text-gray-900 dark:text-gray-200">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(item.price)}
                        </span>
                    )}
                    {item.type && (
                        <span className="text-gray-400">• {item.type}</span>
                    )}
                    {(item.city || item.quartier || item.shop.address) && (
                        <span className="text-gray-400 truncate">• {[item.quartier, item.city].filter(Boolean).join(', ') || item.shop.address}</span>
                    )}
                </div>

                {/* 4. Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                    {item.description}
                </p>
            </div>

            {/* 5. Thumbnail (if available) - Right aligned like Google Product results */}
            {item.images && item.images.length > 0 && (
                <div className="flex-shrink-0 mt-2 md:mt-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
