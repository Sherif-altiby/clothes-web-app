/**
 * Static content for the Velnora home page.
 * All copy lives in messages/*.json (namespace "home"); only ids, links and
 * images live here so they are easy to swap for real data later.
 *
 * NOTE: images are Unsplash placeholders – replace with your own product /
 * campaign photography before launch.
 */

const u = (id: string, w = 1600) =>
    `https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3`;

export const HERO_SLIDES = [
    {
        id: "newSeason",
        href: "/category/new",
        image: u("photo-1483985988355-763728e1935b"),
    },
    {
        id: "denim",
        href: "/category/denim",
        image: u("photo-1541099649105-f69ad21f3246"),
    },
    {
        id: "sport",
        href: "/category/sport",
        image: u("photo-1518611012118-696072aa579a"),
    },
] as const;

export const CATEGORIES = [
    { key: "women", href: "user/category/women", image: u("photo-1515886657613-9f3515b0c78f", 800) },
    { key: "men", href: "user/category/men", image: u("photo-1552374196-c4e7ffc6e126", 800) },
    { key: "kids", href: "/usercategory/kids", image: u("photo-1519238263530-99bdd11df2ea", 800) },
    { key: "shoes", href: "user/category/shoes", image: u("photo-1542291026-7eec264c27ff", 800) },
    { key: "accessories", href: "user/category/accessories", image: u("photo-1584917865442-de89df76afd3", 800) },
    { key: "sport", href: "user/category/sport", image: u("photo-1571019613454-1cb2f99b2d8b", 800) },
] as const;

/**
 * `price` is the regular (pre-discount) price. ProductCard subtracts
 * `discountPercentage` itself and shows `price` struck through.
 */
export const FEATURED_PRODUCTS = [
    {
        id: "1",
        title: "Urban Explorer Jacket",
        description: "Water-resistant shell with fleece lining",
        price: 249.99,
        discountPercentage: 24,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.2,
        reviewsCount: 128,
    },
    {
        id: "2",
        title: "Essential Wool Coat",
        description: "Tailored long coat in a soft wool blend",
        price: 219.0,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.7,
        reviewsCount: 86,
    },
    {
        id: "3",
        title: "Relaxed Oxford Shirt",
        description: "Washed cotton with an easy, roomy fit",
        price: 64.0,
        discountPercentage: 15,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.4,
        reviewsCount: 210,
    },
    {
        id: "4",
        title: "Ribbed Knit Sweater",
        description: "Midweight knit for cool evenings",
        price: 79.5,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.6,
        reviewsCount: 143,
    },
    {
        id: "5",
        title: "Classic White Sneakers",
        description: "Clean leather trainers for every day",
        price: 129.0,
        discountPercentage: 20,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.8,
        reviewsCount: 342,
    },
    {
        id: "6",
        title: "Leather Tote Bag",
        description: "Roomy structured bag with inner pocket",
        price: 159.0,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.5,
        reviewsCount: 67,
    },
    {
        id: "7",
        title: "Slim Chino Trousers",
        description: "Stretch cotton twill, smart or casual",
        price: 69.0,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.3,
        reviewsCount: 175,
    },
    {
        id: "8",
        title: "Everyday Cotton Tee",
        description: "Heavyweight organic cotton crew neck",
        price: 29.0,
        discountPercentage: 10,
        imageUrl:"https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
        rating: 4.5,
        reviewsCount: 512,
    },
];