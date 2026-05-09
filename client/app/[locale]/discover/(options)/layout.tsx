import { PriceFilter } from "@/components/PriceFilter";

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (

        <div className="ctm-container  ">
            <div className="fixed top-20" >
                <PriceFilter />
            </div>
            <div className="w-[calc(100%-350px)] mt-10 pl-4 ml-auto" >
                {children}
            </div>
        </div>
    );
}