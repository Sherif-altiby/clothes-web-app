import { ProductCard } from '@/components/ProductCard'
import React from 'react'

const page = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
            <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
        </div>
    )
}

export default page