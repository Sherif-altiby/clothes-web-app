import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Footer } from "@/components/home/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PerksStrip } from "@/components/home/PerksStrip";

 

export default function HomePage() {
    return (
        <main>
            <div className="container mx-auto px-4 pt-6">
                <HeroSlider />
            </div>
            {/* <PerksStrip /> */}
            <Categories />
            <FeaturedProducts />
         </main>
    );
}