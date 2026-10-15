import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSlider } from "@/components/home/HeroSlider";

 

export default function HomePage() {
    return (
        <main>
            <div className="-mx-4 w-[calc(100%+2rem)] md:-mx-8 md:w-[calc(100%+4rem)] xl:-mx-16 xl:w-[calc(100%+8rem)]">
                <HeroSlider />
            </div>
            {/* <PerksStrip />/ */}
            <Categories />
            <FeaturedProducts />
         </main>
    );
}