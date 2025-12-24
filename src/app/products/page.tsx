"use client";

import React from 'react';
import ProductList from '@/components/ProductList'; // Assuming path to your component

const AllProductsPage: React.FC = () => {
    return (
        <ProductList title="The Entire Collection" />
    );
};

export default AllProductsPage;