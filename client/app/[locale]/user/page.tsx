import { PriceFilter } from '@/components/PriceFilter'
import { ProductCard } from '@/components/ProductCard'
import React from 'react'

const page = () => {
    return (


        <div className='flex mt-10 gap-4  ' >
            <div className=" sticky top-20 h-fit " >
                <PriceFilter />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
                <ProductCard id='1' title='title' description='Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free' price={100} discountPercentage={15} imageUrl='https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3' />
            </div>
        </div>
    )
}

export default page