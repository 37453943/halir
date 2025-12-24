"use client";

import React, { useState, useEffect } from 'react';

// ==========================================================
// 1. TYPE DEFINITIONS & INITIAL DATA
// ==========================================================

// Product Interface
interface ProductItem {
    _id: string; // MongoDB ID as a string
    name: string;
    price: number;
    imageUrl: string;
    featureImage?: string; // ✅ New: feature image URL
    description: string; // ✨ ADDED: Description field
    category: 'men' | 'women' | 'unisex' | 'accessories';
    images?: string[];
    type?: 'tester' | '50ml' | string;
    collectionSlug?: string; // Links to the Collection model
    quantity?: number;
}

// Collection Interface
interface ICollection {
    _id: string; // MongoDB ID
    name: string;
    slug: string; // Used for URLs and product assignment
    images?: string[];
}

// Initial Product Form Data
const initialProductFormData = {
    name: '',
    price: 0,
    imageUrl: '',
    featureImage: '',
    images: [] as string[],
    imagesBase64: [] as string[],
    featureImageBase64: '',
    imagesToRemove: [] as string[], // ✅ staged removals (only persisted on submit)
    description: '', // ✨ ADDED: Initial value for description
    category: '' as '' | 'men' | 'women' | 'unisex' | 'accessories',
    collectionSlug: '', // Initialize new field
    quantity: 0,
    type: '' as '' | 'tester' | '50ml' | string,
};

// Initial Collection Form Data
const initialCollectionFormData: Omit<ICollection, '_id'> & { imagesBase64?: string[] } = {
    name: '',
    slug: '',
    images: [],
    imagesBase64: [],
};

// API endpoint URL for Next.js internal routes
const PRODUCTS_API_URL = '/api/products';
const COLLECTIONS_API_URL = '/api/collections';

// ==========================================================
// 2. COMPONENT DEFINITION
// ==========================================================

const AdminProductsPanel: React.FC = () => {
    // Auth check
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
    const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

    // When a non-authenticated visitor attempts to access admin, redirect to login after a short countdown
    useEffect(() => {
        if (isAdmin !== false) return;
        const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || null) : null;
        if (token) return; // signed in as non-admin — do not auto-redirect

        setRedirectCountdown(4);
        let interval: number | undefined;
        const timer = setTimeout(() => {
            window.location.href = '/login';
        }, 4000);

        interval = window.setInterval(() => {
            setRedirectCountdown((c) => {
                if (c === null) return null;
                if (c <= 1) {
                    window.clearInterval(interval);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (interval) window.clearInterval(interval);
            setRedirectCountdown(null);
        };
    }, [isAdmin]);

    // Improved admin check with clearer error states
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (!res.ok) {
                    if (res.status === 401) setAdminCheckError('session');
                    setIsAdmin(false);
                    return;
                }
                const d = await res.json();
                if (d.user && d.user.role === 'admin') {
                    setIsAdmin(true);
                    setAdminCheckError(null);
                    // Load admin data once the user is confirmed as an admin
                    try {
                        fetchProducts();
                        fetchCollections();
                    } catch (err) {
                        console.error('Failed to load admin data', err);
                    }
                } else if (d.user) {
                    setIsAdmin(false);
                    setAdminCheckError('not-admin');
                } else {
                    setIsAdmin(false);
                    setAdminCheckError('session');
                }
            } catch (e) {
                console.error('Admin check failed', e);
                setIsAdmin(false);
                setAdminCheckError('network');
            }
        })();
    }, []);

    // Load admin data once when user is confirmed as admin
    useEffect(() => {
        if (!isAdmin) return;
        // Fetch products, collections and orders once
        fetchProducts();
        fetchCollections();
        fetchOrders();
    }, [isAdmin]);

    // Product State
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [productLoading, setProductLoading] = useState(true);
    const [productFormData, setProductFormData] = useState(initialProductFormData as any);
    const [isEditingProductId, setIsEditingProductId] = useState<string | null>(null);

    // Collection State
    const [collections, setCollections] = useState<ICollection[]>([]);
    const [collectionLoading, setCollectionLoading] = useState(true);
    const [collectionFormData, setCollectionFormData] = useState(initialCollectionFormData);
    const [isEditingCollectionId, setIsEditingCollectionId] = useState<string | null>(null);

    // Orders (admin)
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    // Track which order is being updated to disable controls during update
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // UI state: which panel to show in the admin dashboard
    const [selectedPanel, setSelectedPanel] = useState<'products' | 'collections' | 'orders'>('products');

    // ==========================================================
    // 3. COLLECTION LOGIC (No changes needed here)
    // ==========================================================

    if (isAdmin === false) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-2">Access restricted</h2>
                <p className="text-sm text-gray-700 mb-4">You do not have permission to view the Admin dashboard. This area is only accessible to administrators.</p>

                <div className="mb-4">
                    {adminCheckError === 'session' && (
                        <p className="text-sm text-gray-600">Your session appears to be invalid or expired. Please <a href="/login" className="underline">log in</a> again as an admin.</p>
                    )}
                    {adminCheckError === 'not-admin' && (
                        <p className="text-sm text-gray-600">You are signed in but your account does not have admin privileges.</p>
                    )}
                    {!adminCheckError && (
                        <p className="text-sm text-gray-600">If you are an administrator, please <a href="/login" className="underline">log in as an admin</a> to continue. You will be redirected to the login page shortly.</p>
                    )}

                    {redirectCountdown !== null && (
                        <div className="mt-2 text-xs text-gray-500">Redirecting to login in {redirectCountdown}s…</div>
                    )}
                </div>

                <div className="flex gap-3">
                    <a href="/" className="px-4 py-2 bg-white border border-gray-300">Return to Home</a>
                    <a href="mailto:help@example.com" className="px-4 py-2 bg-white border border-gray-300">Contact Support</a>
                    <a href="/login" className="px-4 py-2 bg-black text-white">Log in</a>
                </div>
            </div>
        );
    }

    if (isAdmin === null) {
        return (
            <div className="p-8 flex flex-col items-start">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 animate-spin" />
                    <div className="text-sm font-medium">Verifying admin access…</div>
                </div>
                <div className="mt-3 text-sm text-gray-600">Only administrators can access this page. If this message persists, please ensure you are logged in as an admin or contact support.</div>
            </div>
        );
    }

    const fetchCollections = async () => {
        logger.debug('Admin: fetchCollections starting');
        setCollectionLoading(true);
        try {
            const response = await fetch(COLLECTIONS_API_URL);
            if (!response.ok) {
                const txt = await response.text().catch(() => '');
                throw new Error(`Failed to fetch collections, status ${response.status} ${txt}`);
            }
            const data: ICollection[] = await response.json();
            logger.debug('Admin: fetchCollections received', data.length);
            setCollections(data);
        } catch (error) {
            logger.error('Error fetching collections:', error);
        } finally {
            setCollectionLoading(false);
        }
    };

    const handleCollectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCollectionFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Convert FileList to base64 strings
    const filesToBase64 = (files: FileList | null): Promise<string[]> => {
        if (!files) return Promise.resolve([]);
        const arr = Array.from(files);
        return Promise.all(arr.map(file => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        })));
    };

    const handleCollectionFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const base64s = await filesToBase64(files);
        setCollectionFormData(prev => ({ ...prev, imagesBase64: base64s }));
    };

    const resetCollectionForm = () => {
        setCollectionFormData(initialCollectionFormData);
        setIsEditingCollectionId(null);
    };

    const startEditCollection = (collection: ICollection) => {
        setIsEditingCollectionId(collection._id);
        setCollectionFormData({
            name: collection.name,
            slug: collection.slug,
            images: collection.images || [],
            imagesBase64: [],
        });
    };

    const handleCollectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collectionFormData.slug)) {
            alert('Slug must be lowercase, contain only letters, numbers, and hyphens (e.g., "my-new-collection").');
            return;
        }

        const method = isEditingCollectionId ? 'PATCH' : 'POST';
        const url = isEditingCollectionId ? `${COLLECTIONS_API_URL}/${isEditingCollectionId}` : COLLECTIONS_API_URL;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collectionFormData),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Enhanced error handling for duplicate slug (E11000)
                let errorMessage = errorData.message || `Failed to save collection! Status: ${response.status}`;
                if (errorData.code === 11000 && errorData.keyPattern && errorData.keyValue) {
                    errorMessage = `Error: The slug "${Object.values(errorData.keyValue)[0]}" already exists. Please choose a unique slug.`;
                }

                throw new Error(errorMessage);
            }

            resetCollectionForm();
            fetchCollections();
        } catch (error) {
            console.error('Collection submission error:', error);
            alert(`Failed to save collection: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleDeleteCollection = async (_id: string) => {
        if (!window.confirm('WARNING: Deleting this collection will NOT remove the products assigned to it, but those products will display "N/A" for collection. Are you sure?')) return;

        try {
            const response = await fetch(`${COLLECTIONS_API_URL}/${_id}`, { method: 'DELETE' });

            if (response.status === 204 || response.ok) {
                setCollections(prev => prev.filter(c => c._id !== _id));
            } else {
                throw new Error(`Failed to delete collection. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Collection deletion error:', error);
            alert(`Failed to delete collection: ${error}`);
        }
    };

    // ==========================================================
    // 4. PRODUCT LOGIC
    // ==========================================================

    const fetchProducts = async () => {
        logger.debug('Admin: fetchProducts starting');
        setProductLoading(true);
        try {
            const response = await fetch(PRODUCTS_API_URL);
            if (!response.ok) {
                const txt = await response.text().catch(() => '');
                throw new Error(`Failed to fetch products, status ${response.status} ${txt}`);
            }
            const data: ProductItem[] = await response.json();
            logger.debug('Admin: fetchProducts received', data.length);
            setProducts(data);
        } catch (error) {
            logger.error('Error fetching products:', error);
            alert('Could not load products. Check server connection.');
        } finally {
            setProductLoading(false);
        }
    };



    const fetchOrders = async () => {
        logger.debug('Admin: fetchOrders starting');
        setOrdersLoading(true);
        try {
            const res = await fetch('/api/orders', { credentials: 'include' });
            if (res.status === 401) {
                logger.debug('Admin: fetchOrders unauthorized (401)');
                setOrders([]);
                return;
            }
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`Failed to fetch orders, status ${res.status} ${txt}`);
            }
            const data = await res.json();
            logger.debug('Admin: fetchOrders received', (data || []).length);
            setOrders(data || []);
        } catch (err) {
            logger.error('Failed to fetch orders', err);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };


    const updateOrderStatus = async (_id: any, status: string) => {
        // Robust id extraction to handle strings or objects like { $oid: '...' }
        let id: string;
        try {
            if (typeof _id === 'string') id = _id;
            else if (_id && typeof _id === 'object') {
                if (typeof (_id as any).toString === 'function') id = (_id as any).toString();
                else if ((_id as any).$oid) id = (_id as any).$oid;
                else id = JSON.stringify(_id);
            } else {
                id = String(_id);
            }
        } catch (e) {
            id = String(_id);
        }

        console.debug('Admin: updating order', { rawId: _id, id, status });
        setUpdatingOrderId(id);
        try {
            const url = `/api/orders/${encodeURIComponent(id)}`;
            console.debug('Admin: PATCH', url, { status });
            const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
            const body = await res.json().catch(() => ({}));
            console.debug('Admin: PATCH response', res.status, body);
            if (!res.ok) {
                console.error('Order update failed', res.status, body);
                if (res.status === 401) {
                    alert('Unauthorized. Please log in as an admin.');
                    window.location.href = '/login';
                    return;
                }
                if (res.status === 404) {
                    // The order was not found — refresh list and inform the user
                    await fetchOrders();
                    alert('Order not found (it may have been removed). The orders list has been refreshed.');
                    return;
                }
                alert(body?.error || body?.message || 'Failed to update order status');
                return;
            }
            // Refresh orders after successful update
            await fetchOrders();
        } catch (err) {
            console.error(err);
            alert('Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // ✨ MODIFIED: Include HTMLTextAreaElement in the change handler type
    const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setProductFormData((prev: any) => ({
            ...prev,
            [name]: name === 'price' || name === 'quantity' ? Number(value) || 0 : value,
        }));
    };

    const handleProductFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const base64s = await filesToBase64(files);
        setProductFormData((prev: any) => ({ ...prev, imagesBase64: base64s }));
    };

    const handleFeatureImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const base64s = await filesToBase64(files);
        // only take first file as feature image
        setProductFormData((prev: any) => ({ ...prev, featureImageBase64: base64s[0] || '' }));
    };

    // Mark/unmark a gallery image for removal (staged — requires pressing Update to persist)
    const toggleMarkImageForRemoval = (imagePath: string) => {
        setProductFormData((prev: any) => {
            const toRemove: string[] = prev.imagesToRemove || [];
            const exists = toRemove.includes(imagePath);
            return {
                ...prev,
                imagesToRemove: exists ? toRemove.filter(i => i !== imagePath) : [...toRemove, imagePath],
            };
        });
    };

    const resetProductForm = () => {
        setProductFormData(initialProductFormData);
        setIsEditingProductId(null);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = isEditingProductId ? 'PATCH' : 'POST';
        const url = isEditingProductId ? `${PRODUCTS_API_URL}/${isEditingProductId}` : PRODUCTS_API_URL;

        const dataToSend = {
            ...productFormData,
            collectionSlug: productFormData.collectionSlug || undefined,
            // Only send imagesToRemove if there are items (staged deletions)
            imagesToRemove: productFormData.imagesToRemove && productFormData.imagesToRemove.length > 0 ? productFormData.imagesToRemove : undefined,
            // Price must be converted back to a number if the form uses strings for submission
            price: Number(productFormData.price),
            quantity: Number(productFormData.quantity) || 0,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Check for Mongoose validation error structure
                if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).map((err: any) => err.message).join('\n');
                    throw new Error(`Validation Failed:\n${validationErrors}`);
                }
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            resetProductForm();
            fetchProducts();
        } catch (error) {
            console.error('Product submission error:', error);
            alert(`Failed to save product: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleDeleteProduct = async (_id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`${PRODUCTS_API_URL}/${_id}`, { method: 'DELETE' });

            if (response.status === 204) {
                setProducts(prev => prev.filter(p => p._id !== _id));
            } else {
                throw new Error(`Failed to delete product. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Deletion error:', error);
            alert(`Failed to delete product: ${error}`);
        }
    };

    const startEditProduct = (product: ProductItem) => {
        setIsEditingProductId(product._id);
        setProductFormData({
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            featureImage: product.featureImage || '',
            images: product.images || [],
            imagesBase64: [],
            featureImageBase64: '',
            imagesToRemove: [],
            description: product.description, // ✨ ADDED: Load description for editing
            category: product.category || '',
            collectionSlug: product.collectionSlug || '',
            quantity: product.quantity || 0,
            type: product.type || '',
        });
    };

    // Create collection options list for the product dropdown
    const collectionOptions = [
        { slug: '', name: 'Collection' },
        ...collections.map(c => ({ slug: c.slug, name: c.name }))
    ];


    // ==========================================================
    // 5. RENDER
    // ==========================================================

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* SIDEBAR */}
                <aside className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-3">Admin</h3>
                    <nav className="flex flex-col gap-2">
                        <button onClick={() => setSelectedPanel('collections')} className={`text-left px-3 py-2 rounded ${selectedPanel === 'collections' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Collections</button>
                        <button onClick={() => setSelectedPanel('products')} className={`text-left px-3 py-2 rounded ${selectedPanel === 'products' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Products</button>
                        <button onClick={() => setSelectedPanel('orders')} className={`text-left px-3 py-2 rounded ${selectedPanel === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>Orders</button>
                    </nav>
                </aside>

                {/* MAIN */}
                <main>
                    {/* COLLECTIONS PANEL */}
                    {selectedPanel === 'collections' && (
                        <div className="bg-white p-6 rounded-lg shadow-xl mb-10 border-l-4 border-green-500">
                            <h2 className="text-2xl font-semibold mb-4 text-black-600">
                                {isEditingCollectionId ? `✏️ Edit Collection` : '➕ Manage Collections'}
                            </h2>
                            <form onSubmit={handleCollectionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text" name="name" placeholder="Collection Name (e.g., Solstice)" value={collectionFormData.name}
                                    onChange={handleCollectionChange} required className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black col-span-1"
                                />
                                <input
                                    type="text" name="slug" placeholder="Slug (e.g., solstice-line)" value={collectionFormData.slug}
                                    onChange={handleCollectionChange} required
                                    className={`p-2 border rounded col-span-1 ${isEditingCollectionId ? 'bg-gray-100' : ''}`}
                                    disabled={!!isEditingCollectionId}
                                />

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Collection Images</label>
                                    <input type="file" name="images" accept="image/*" multiple onChange={handleCollectionFiles} className="p-2" />
                                </div>

                                <div className="col-span-2 flex justify-end gap-2 mt-4">
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 rounded font-semibold text-white transition-colors shadow ${isEditingCollectionId ? 'bg-black hover:opacity-90' : 'bg-black hover:opacity-90'}`}
                                    >
                                        {isEditingCollectionId ? 'Update Collection' : 'Create Collection'}
                                    </button>
                                    {isEditingCollectionId && (
                                        <button
                                            type="button"
                                            onClick={resetCollectionForm}
                                            className="px-3 py-1 rounded font-semibold bg-gray-800 text-white hover:opacity-90"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Collection List */}
                            <h3 className="text-xl font-semibold mt-8 mb-3">Existing Collections ({collections.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {collectionLoading ? (
                                            <tr><td colSpan={3} className="text-center py-2 text-gray-500">Loading...</td></tr>
                                        ) : (
                                            collections.map((collection) => (
                                                <tr key={collection._id} className={isEditingCollectionId === collection._id ? 'bg-yellow-50' : ''}>
                                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{collection.name}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{collection.slug}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => startEditCollection(collection)} className="px-3 py-1 bg-black text-white rounded mr-2 hover:opacity-90">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteCollection(collection._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- 5.2 PRODUCT ADD/EDIT FORM (UPDATED) --- */}

                    {selectedPanel === 'products' && (
                        <div className="bg-white p-6 rounded-lg shadow-xl mb-10 border-l-4 border-indigo-500">
                            <h2 className="text-2xl font-semibold mb-4 text-black-600">
                                {isEditingProductId ? `✏️ Edit Product (ID: ${isEditingProductId?.slice(-4)})` : '➕ Add New Product'}
                            </h2>
                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                <input
                                    type="text" name="name" placeholder="Product Name" value={productFormData.name}
                                    onChange={handleProductChange} required className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black col-span-2"
                                />
                                <input
                                    type="number" name="price" placeholder="Price" value={productFormData.price || ''}
                                    onChange={handleProductChange} required min="0" step="0.01" className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <input
                                    type="number" name="quantity" placeholder="Quantity" value={productFormData.quantity || ''}
                                    onChange={handleProductChange} required min="0" step="1" className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                                />

                                {/* --- IMAGE UPLOAD ROW: product gallery (wide) + feature image (narrow) --- */}
                                <div className="col-span-1 md:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Product Images</label>
                                        <input type="file" name="images" accept="image/*" multiple onChange={handleProductFiles} className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black w-full" />

                                        {/* Existing gallery images (when editing) */}
                                        {productFormData.images && productFormData.images.length > 0 && (
                                            <div className="mt-3 flex gap-3 flex-wrap">
                                                {productFormData.images.map((img: string) => {
                                                    const isMarked = (productFormData.imagesToRemove || []).includes(img);
                                                    return (
                                                        <div key={img} className="relative inline-block">
                                                            <img src={img} className={`w-24 h-24 object-cover rounded transition-opacity ${isMarked ? 'opacity-40' : 'opacity-100'}`} />

                                                            {!isMarked ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleMarkImageForRemoval(img)}
                                                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                                                                    title="Mark for removal"
                                                                >
                                                                    ×
                                                                </button>
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                    <span className="bg-yellow-300 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">Pending</span>
                                                                </div>
                                                            )}

                                                            {isMarked && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleMarkImageForRemoval(img)}
                                                                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white rounded px-2 text-xs"
                                                                >
                                                                    Undo
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Preview newly selected images (before saving) */}
                                        {productFormData.imagesBase64 && productFormData.imagesBase64.length > 0 && (
                                            <div className="mt-3 flex gap-3 flex-wrap">
                                                {productFormData.imagesBase64.map((b64: string, idx: number) => (
                                                    <img key={idx} src={b64} className="w-24 h-24 object-cover rounded" />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-1 bg-gray-50 p-4 rounded flex flex-col items-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Feature Image (single)</label>
                                        <input type="file" name="featureImage" accept="image/*" onChange={handleFeatureImageFile} className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black w-full" />
                                        {/* Show existing saved feature image when editing (stored URL) */}
                                        {productFormData.featureImage && !productFormData.featureImageBase64 && (
                                            <img src={productFormData.featureImage} alt="feature" className="w-32 h-32 object-cover mt-3 rounded" />
                                        )}
                                        {/* Show preview of newly selected feature image (base64) */}
                                        {productFormData.featureImageBase64 && (
                                            <img src={productFormData.featureImageBase64} alt="feature-preview" className="w-32 h-32 object-cover mt-3 rounded" />
                                        )}
                                    </div>
                                </div>

                                <select name="category" value={productFormData.category} onChange={handleProductChange} required className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black">
                                    <option value="" disabled>Category</option>
                                    <option value="men">Men</option>
                                    <option value="women">Women</option>
                                </select>

                                <select name="type" value={productFormData.type} onChange={handleProductChange} required className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black">
                                    <option value="" disabled>Type</option>
                                    <option value="tester">Tester</option>
                                    <option value="50ml">50ml</option>
                                </select>

                                {/* DYNAMIC COLLECTION INPUT */}
                                <select
                                    name="collectionSlug"
                                    value={productFormData.collectionSlug}
                                    onChange={handleProductChange}
                                    className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                                    disabled={collectionLoading}
                                >
                                    {collectionOptions.map(c => (
                                        <option key={c.slug || 'none'} value={c.slug} disabled={c.slug === ''}>{c.name}</option>
                                    ))}
                                </select>

                                {/* ✨ ADDED: TEXTAREA FOR DESCRIPTION */}
                                <textarea
                                    name="description"
                                    placeholder="Product Description (Required)"
                                    value={productFormData.description}
                                    onChange={handleProductChange}
                                    required
                                    rows={3}
                                    className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-black col-span-1 md:col-span-6" // Span across all columns
                                />

                                <div className="col-span-1 md:col-span-6 flex justify-end gap-2">
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 rounded font-semibold text-white transition-colors shadow ${isEditingProductId ? 'bg-black hover:opacity-90' : 'bg-black hover:opacity-90'}`}
                                    >
                                        {isEditingProductId ? 'Update Product' : 'Create Product'}
                                    </button>
                                    {isEditingProductId && (
                                        <button
                                            type="button"
                                            onClick={resetProductForm}
                                            className="px-3 py-1 rounded font-semibold bg-gray-800 text-white hover:opacity-90"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-semibold mb-4">Current Products ({products.length})</h2>
                        {productLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading products from database...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.map((product) => (
                                            <tr key={product._id} className={isEditingProductId === product._id ? 'bg-yellow-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <img
                                                        src={product.featureImage ? product.featureImage : (product.images && product.images.length > 0 ? product.images[0] : (product.imageUrl || 'https://placehold.co/50x50/ccc/fff?text=No+Img'))}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">RS {product.price.toFixed(0)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantity ?? 0}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{product.category}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 capitalize">
                                                    {product.collectionSlug || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => startEditProduct(product)} className="px-3 py-1 bg-black text-white rounded mr-3 hover:opacity-90">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteProduct(product._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>



                    {/* --- 5.4 ORDERS PANEL (Admin) --- */}
                    {selectedPanel === 'orders' && (
                        <div className="bg-white p-6 rounded-lg shadow-xl mt-8">
                            <h2 className="text-2xl font-semibold mb-4">Recent Orders ({orders.length})</h2>
                            {ordersLoading ? (
                                <div className="text-center py-10 text-gray-500">Loading orders...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((o) => (
                                                <tr key={o._id}>
                                                    <td className="px-3 py-2 text-sm font-mono">{String(o._id).slice(-8)}</td>
                                                    <td className="px-3 py-2 text-sm">{new Date(o.createdAt).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-sm">{o.shipping?.email}</td>
                                                    <td className="px-3 py-2 text-sm">{(o.items || []).length}</td>
                                                    <td className="px-3 py-2 text-sm">RS {o.total}</td>
                                                    <td className="px-3 py-2 text-sm">
                                                        <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs">{o.status}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm">
                                                        <select value={o.status} onChange={(e) => { if (e.target.value !== o.status) updateOrderStatus(o._id, e.target.value); }} disabled={updatingOrderId === o._id} className="p-1 border">
                                                            <option value="pending">pending</option>
                                                            <option value="shipped">shipped</option>
                                                        </select>
                                                        {updatingOrderId === o._id && <span className="ml-2 text-xs text-gray-500">Updating…</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>)}
                </main>
            </div>

        </div>
    );
};

export default AdminProductsPanel;