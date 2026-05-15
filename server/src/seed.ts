import { PrismaClient, Role, OrderStatus, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.couponUsage.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('Cleared existing data...');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: Role.ADMIN,
            phone: '+1234567890',
            address: '123 Admin Street, City, Country',
            avatar: 'https://i.pravatar.cc/150?img=1',
        },
    });

    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                role: Role.USER,
                phone: '+1234567891',
                address: '456 User Lane, Town, Country',
                avatar: 'https://i.pravatar.cc/150?img=2',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: hashedPassword,
                role: Role.USER,
                phone: '+1234567892',
                address: '789 Customer Road, Village, Country',
                avatar: 'https://i.pravatar.cc/150?img=3',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Mike Johnson',
                email: 'mike@example.com',
                password: hashedPassword,
                role: Role.USER,
                avatar: 'https://i.pravatar.cc/150?img=4',
            },
        }),
    ]);

    console.log('Created users...');

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({ data: { title: 'Electronics' } }),
        prisma.category.create({ data: { title: 'Clothing' } }),
        prisma.category.create({ data: { title: 'Home & Garden' } }),
        prisma.category.create({ data: { title: 'Sports & Outdoors' } }),
        prisma.category.create({ data: { title: 'Books' } }),
        prisma.category.create({ data: { title: 'Toys & Games' } }),
    ]);

    console.log('Created categories...');

    // Create 30 Products
    const productsData = [
        // Electronics (10 products)
        {
            title: 'Wireless Bluetooth Headphones',
            description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
            baseSalary: 80,
            profit: 40,
            discount: 15,
            categoryId: categories[0].id,
            counts: 50,
            images: [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
                'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
                'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800',
            ],
        },
        {
            title: 'Smart Watch Pro',
            description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, and 5-day battery life.',
            baseSalary: 200,
            profit: 100,
            discount: 10,
            categoryId: categories[0].id,
            counts: 35,
            images: [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
                'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
                'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
            ],
        },
        {
            title: 'Portable Bluetooth Speaker',
            description: 'Waterproof portable speaker with 360-degree sound and 12-hour playtime.',
            baseSalary: 45,
            profit: 25,
            discount: 20,
            categoryId: categories[0].id,
            counts: 80,
            images: [
                'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
                'https://images.unsplash.com/photo-1558584673-c834fb1cc3ca?w=800',
                'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800',
                'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
            ],
        },
        {
            title: 'USB-C Fast Charger',
            description: '65W USB-C power adapter with fast charging technology for laptops and phones.',
            baseSalary: 25,
            profit: 15,
            discount: 0,
            categoryId: categories[0].id,
            counts: 100,
            images: [
                'https://images.unsplash.com/photo-1591290619762-2223d5e8d14b?w=800',
                'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
                'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800',
                'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800',
            ],
        },
        {
            title: 'Wireless Mouse',
            description: 'Ergonomic wireless mouse with precision tracking and long battery life.',
            baseSalary: 20,
            profit: 12,
            discount: 5,
            categoryId: categories[0].id,
            counts: 120,
            images: [
                'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800',
                'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
                'https://images.unsplash.com/photo-1563297007-0686b7003af7?w=800',
                'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800',
            ],
        },
        {
            title: 'HD Webcam',
            description: '1080p HD webcam with built-in microphone, perfect for video conferencing.',
            baseSalary: 50,
            profit: 25,
            discount: 12,
            categoryId: categories[0].id,
            counts: 60,
            images: [
                'https://images.unsplash.com/photo-1625222075230-47462f45eefa?w=800',
                'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800',
                'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
                'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=800',
            ],
        },
        {
            title: 'Mechanical Gaming Keyboard',
            description: 'RGB backlit mechanical keyboard with customizable keys and tactile switches.',
            baseSalary: 90,
            profit: 45,
            discount: 18,
            categoryId: categories[0].id,
            counts: 45,
            images: [
                'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800',
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
                'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800',
                'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=800',
            ],
        },
        {
            title: 'Laptop Stand',
            description: 'Adjustable aluminum laptop stand for improved ergonomics and cooling.',
            baseSalary: 30,
            profit: 18,
            discount: 0,
            categoryId: categories[0].id,
            counts: 75,
            images: [
                'https://images.unsplash.com/photo-1616627547584-bf28cfedc961?w=800',
                'https://images.unsplash.com/photo-1625225233840-695456021cde?w=800',
                'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
                'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
            ],
        },
        {
            title: 'Phone Case with Card Holder',
            description: 'Durable leather phone case with built-in card slots and kickstand.',
            baseSalary: 15,
            profit: 10,
            discount: 25,
            categoryId: categories[0].id,
            counts: 200,
            images: [
                'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800',
                'https://images.unsplash.com/photo-1585906274262-dc9084a6b8f4?w=800',
                'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800',
                'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800',
            ],
        },
        {
            title: 'External SSD 1TB',
            description: 'Ultra-fast portable SSD with 1TB storage and USB 3.2 connectivity.',
            baseSalary: 100,
            profit: 50,
            discount: 15,
            categoryId: categories[0].id,
            counts: 40,
            images: [
                'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',
                'https://images.unsplash.com/photo-1624696941338-934bf86c28b5?w=800',
                'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800',
                'https://images.unsplash.com/photo-1622285136864-c7e3c2b7c0b2?w=800',
            ],
        },

        // Clothing (8 products)
        {
            title: 'Classic Cotton T-Shirt',
            description: 'Comfortable 100% cotton t-shirt in multiple colors. Perfect for everyday wear.',
            baseSalary: 12,
            profit: 8,
            discount: 10,
            categoryId: categories[1].id,
            counts: 150,
            images: [
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
                'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
                'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800',
                'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
            ],
        },
        {
            title: 'Slim Fit Jeans',
            description: 'Premium denim jeans with stretch fabric for comfort and style.',
            baseSalary: 40,
            profit: 25,
            discount: 20,
            categoryId: categories[1].id,
            counts: 90,
            images: [
                'https://images.unsplash.com/photo-1542272454315-7ad9f8e1f678?w=800',
                'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
                'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800',
                'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
            ],
        },
        {
            title: 'Hooded Sweatshirt',
            description: 'Cozy fleece-lined hoodie with kangaroo pocket and adjustable drawstring.',
            baseSalary: 35,
            profit: 20,
            discount: 15,
            categoryId: categories[1].id,
            counts: 110,
            images: [
                'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
                'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
                'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800',
                'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
            ],
        },
        {
            title: 'Running Sneakers',
            description: 'Lightweight athletic shoes with breathable mesh and cushioned sole.',
            baseSalary: 60,
            profit: 35,
            discount: 25,
            categoryId: categories[1].id,
            counts: 70,
            images: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
                'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
                'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800',
            ],
        },
        {
            title: 'Leather Jacket',
            description: 'Genuine leather jacket with zippered pockets and classic biker style.',
            baseSalary: 150,
            profit: 80,
            discount: 10,
            categoryId: categories[1].id,
            counts: 25,
            images: [
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
                'https://images.unsplash.com/photo-1562751361-fa7c2c0f9d1b?w=800',
                'https://images.unsplash.com/photo-1520975867597-0af37a22e31e?w=800',
                'https://images.unsplash.com/photo-1578932750355-5eb30ece487a?w=800',
            ],
        },
        {
            title: 'Summer Dress',
            description: 'Flowy floral print dress perfect for warm weather and casual occasions.',
            baseSalary: 45,
            profit: 25,
            discount: 30,
            categoryId: categories[1].id,
            counts: 65,
            images: [
                'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
                'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
                'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=800',
            ],
        },
        {
            title: 'Baseball Cap',
            description: 'Adjustable cotton baseball cap with embroidered logo.',
            baseSalary: 18,
            profit: 10,
            discount: 0,
            categoryId: categories[1].id,
            counts: 130,
            images: [
                'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
                'https://images.unsplash.com/photo-1589938518987-f7cec539c5c6?w=800',
                'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800',
                'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800',
            ],
        },
        {
            title: 'Wool Winter Scarf',
            description: 'Warm and soft merino wool scarf in multiple patterns.',
            baseSalary: 28,
            profit: 15,
            discount: 5,
            categoryId: categories[1].id,
            counts: 85,
            images: [
                'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',
                'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
                'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800',
                'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800',
            ],
        },

        // Home & Garden (6 products)
        {
            title: 'Aromatherapy Diffuser',
            description: 'Ultrasonic essential oil diffuser with LED lights and auto shut-off.',
            baseSalary: 30,
            profit: 18,
            discount: 15,
            categoryId: categories[2].id,
            counts: 95,
            images: [
                'https://images.unsplash.com/photo-1597184553653-81606cfa040e?w=800',
                'https://images.unsplash.com/photo-1585128903994-03e4f8f6f1d5?w=800',
                'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
                'https://images.unsplash.com/photo-1583944179243-1c0db6dc2c25?w=800',
            ],
        },
        {
            title: 'Ceramic Planter Set',
            description: 'Set of 3 modern ceramic planters with drainage holes and saucers.',
            baseSalary: 25,
            profit: 15,
            discount: 10,
            categoryId: categories[2].id,
            counts: 70,
            images: [
                'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
                'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800',
                'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800',
                'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
            ],
        },
        {
            title: 'Throw Pillow Covers',
            description: 'Set of 4 decorative velvet throw pillow covers in assorted colors.',
            baseSalary: 22,
            profit: 12,
            discount: 20,
            categoryId: categories[2].id,
            counts: 100,
            images: [
                'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800',
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
                'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
                'https://images.unsplash.com/photo-1600494448655-f5d96f5e08c3?w=800',
            ],
        },
        {
            title: 'LED String Lights',
            description: '33ft waterproof LED fairy lights with remote control and timer.',
            baseSalary: 20,
            profit: 12,
            discount: 0,
            categoryId: categories[2].id,
            counts: 120,
            images: [
                'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800',
                'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
                'https://images.unsplash.com/photo-1543373014-cfe4f4bc1cdf?w=800',
                'https://images.unsplash.com/photo-1578962683536-e868f3a3913f?w=800',
            ],
        },
        {
            title: 'Kitchen Knife Set',
            description: 'Professional 8-piece stainless steel knife set with wooden block.',
            baseSalary: 70,
            profit: 40,
            discount: 25,
            categoryId: categories[2].id,
            counts: 45,
            images: [
                'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800',
                'https://images.unsplash.com/photo-1599751449307-290cf67d0155?w=800',
                'https://images.unsplash.com/photo-1589662378535-702166f429c9?w=800',
                'https://images.unsplash.com/photo-1591465473520-a55644e02e55?w=800',
            ],
        },
        {
            title: 'Bath Towel Set',
            description: 'Ultra-soft 6-piece Egyptian cotton towel set with decorative border.',
            baseSalary: 50,
            profit: 28,
            discount: 15,
            categoryId: categories[2].id,
            counts: 60,
            images: [
                'https://images.unsplash.com/photo-1600623056905-4bbce9f9f2de?w=800',
                'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800',
                'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800',
                'https://images.unsplash.com/photo-1608215840179-c3ab949667ad?w=800',
            ],
        },

        // Sports & Outdoors (4 products)
        {
            title: 'Yoga Mat with Strap',
            description: 'Premium non-slip yoga mat with alignment markers and carrying strap.',
            baseSalary: 28,
            profit: 15,
            discount: 10,
            categoryId: categories[3].id,
            counts: 85,
            images: [
                'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
                'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800',
                'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800',
                'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
            ],
        },
        {
            title: 'Camping Tent 4-Person',
            description: 'Waterproof family tent with easy setup and ventilation windows.',
            baseSalary: 120,
            profit: 60,
            discount: 20,
            categoryId: categories[3].id,
            counts: 30,
            images: [
                'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
                'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
                'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=800',
                'https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?w=800',
            ],
        },
        {
            title: 'Resistance Bands Set',
            description: 'Set of 5 resistance bands with handles, ankle straps, and door anchor.',
            baseSalary: 22,
            profit: 13,
            discount: 15,
            categoryId: categories[3].id,
            counts: 110,
            images: [
                'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800',
                'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800',
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
                'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800',
            ],
        },
        {
            title: 'Water Bottle 32oz',
            description: 'Insulated stainless steel water bottle keeps drinks cold for 24 hours.',
            baseSalary: 24,
            profit: 14,
            discount: 0,
            categoryId: categories[3].id,
            counts: 140,
            images: [
                'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
                'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?w=800',
                'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800',
                'https://images.unsplash.com/photo-1581098365948-6b5a0e3e2d55?w=800',
            ],
        },

        // Books (1 product)
        {
            title: 'Best-Selling Novel Collection',
            description: 'Bundle of 5 contemporary fiction best-sellers in paperback.',
            baseSalary: 40,
            profit: 20,
            discount: 30,
            categoryId: categories[4].id,
            counts: 50,
            images: [
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
                'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
                'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800',
                'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
            ],
        },

        // Toys & Games (1 product)
        {
            title: 'Building Blocks Set',
            description: '500-piece creative building blocks set compatible with major brands.',
            baseSalary: 35,
            profit: 20,
            discount: 15,
            categoryId: categories[5].id,
            counts: 75,
            images: [
                'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
                'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800',
                'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800',
                'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
            ],
        },
    ];

    const products = await Promise.all(
        productsData.map((product) => prisma.product.create({ data: product }))
    );

    console.log('Created 30 products...');

    // Create Carts for users
    const cart1 = await prisma.cart.create({
        data: {
            userId: users[0].id,
            items: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                        unitPrice: products[0].baseSalary + products[0].profit,
                    },
                    {
                        productId: products[10].id,
                        quantity: 1,
                        unitPrice: products[10].baseSalary + products[10].profit,
                    },
                ],
            },
        },
    });

    const cart2 = await prisma.cart.create({
        data: {
            userId: users[1].id,
            items: {
                create: [
                    {
                        productId: products[5].id,
                        quantity: 1,
                        unitPrice: products[5].baseSalary + products[5].profit,
                    },
                ],
            },
        },
    });

    console.log('Created carts...');

    // Create Favorites
    await prisma.favorite.createMany({
        data: [
            { userId: users[0].id, productId: products[1].id },
            { userId: users[0].id, productId: products[3].id },
            { userId: users[0].id, productId: products[15].id },
            { userId: users[1].id, productId: products[0].id },
            { userId: users[1].id, productId: products[10].id },
            { userId: users[2].id, productId: products[20].id },
        ],
    });

    console.log('Created favorites...');

    // Create Orders
    const order1 = await prisma.order.create({
        data: {
            userId: users[0].id,
            status: OrderStatus.DELIVERED,
            total: 240,
            items: {
                create: [
                    {
                        productId: products[1].id,
                        quantity: 1,
                        unitPrice: products[1].baseSalary + products[1].profit,
                    },
                    {
                        productId: products[11].id,
                        quantity: 2,
                        unitPrice: products[11].baseSalary + products[11].profit,
                    },
                ],
            },
        },
    });

    const order2 = await prisma.order.create({
        data: {
            userId: users[1].id,
            status: OrderStatus.SHIPPED,
            total: 150,
            items: {
                create: [
                    {
                        productId: products[4].id,
                        quantity: 3,
                        unitPrice: products[4].baseSalary + products[4].profit,
                    },
                ],
            },
        },
    });

    const order3 = await prisma.order.create({
        data: {
            userId: users[2].id,
            status: OrderStatus.PENDING,
            total: 95,
            items: {
                create: [
                    {
                        productId: products[2].id,
                        quantity: 1,
                        unitPrice: products[2].baseSalary + products[2].profit,
                    },
                ],
            },
        },
    });

    console.log('Created orders...');

    // Create Reviews
    await prisma.review.createMany({
        data: [
            {
                userId: users[0].id,
                productId: products[1].id,
                rating: 5,
                comment: 'Excellent product! Highly recommend.',
            },
            {
                userId: users[0].id,
                productId: products[11].id,
                rating: 4,
                comment: 'Good quality, fits perfectly.',
            },
            {
                userId: users[1].id,
                productId: products[0].id,
                rating: 5,
                comment: 'Amazing sound quality and battery life!',
            },
            {
                userId: users[2].id,
                productId: products[2].id,
                rating: 4,
                comment: 'Great speaker for outdoor use.',
            },
            {
                userId: users[1].id,
                productId: products[10].id,
                rating: 5,
                comment: 'Very comfortable and stylish!',
            },
        ],
    });

    console.log('Created reviews...');

    // Create Coupons
    await prisma.coupon.createMany({
        data: [
            {
                code: 'WELCOME10',
                description: 'Welcome discount for new customers',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 10,
                minOrderValue: 50,
                maxUses: 100,
                usedCount: 5,
                isActive: true,
            },
            {
                code: 'SAVE20',
                description: '20% off on orders above $100',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minOrderValue: 100,
                maxUses: 50,
                usedCount: 12,
                userLimit: 1,
                isActive: true,
            },
            {
                code: 'FLAT15',
                description: '$15 flat discount',
                discountType: DiscountType.FIXED,
                discountValue: 15,
                minOrderValue: 75,
                maxUses: 200,
                usedCount: 45,
                isActive: true,
            },
            {
                code: 'SUMMER25',
                description: 'Summer sale - 25% off',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 25,
                minOrderValue: 80,
                maxUses: 150,
                usedCount: 67,
                expiresAt: new Date('2026-08-31'),
                isActive: true,
            },
            {
                code: 'EXPIRED',
                description: 'Expired coupon',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 30,
                expiresAt: new Date('2025-01-01'),
                isActive: false,
            },
        ],
    });

    console.log('Created coupons...');

    console.log('✅ Seed data created successfully!');
    console.log(`- ${categories.length} categories`);
    console.log(`- ${products.length} products`);
    console.log(`- ${users.length + 1} users (including admin)`);
    console.log('- Carts, favorites, orders, reviews, and coupons created');
}

main()
    .catch((e) => {
        console.error('Error seeding data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });