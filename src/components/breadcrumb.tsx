import Link from 'next/link';
import React from 'react';

// Define the structure for a breadcrumb item
interface BreadcrumbItem {
    label: string;
    href: string;
    isCurrent?: boolean; // To mark the last item
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2 sm:space-x-3">
                {items.map((item, index) => (
                    <li key={item.label}>
                        <div className="flex items-center">
                            {/* Separator, hidden for the first item */}
                            {index > 0 && (
                                <svg
                                    className="flex-shrink-0 h-5 w-5 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                >
                                    <path d="M5.555 17.776l8.807-15.65H1.38V2h15.24v1.173L7.962 17.776H5.555z" />
                                </svg>
                            )}

                            <Link
                                href={item.href}
                                className={`text-sm font-medium ${item.isCurrent
                                        ? 'text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                    } ${index > 0 ? 'ml-2 sm:ml-3' : ''}`}
                                aria-current={item.isCurrent ? 'page' : undefined}
                            >
                                {item.label}
                            </Link>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;