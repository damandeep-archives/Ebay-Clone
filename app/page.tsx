"use client";
import Header from "@/components/Header";
import { BanknotesIcon, ClockIcon } from "@heroicons/react/24/outline";
import {
  useActiveListings,
  useContract,
  MediaRenderer,
  ListingType,
} from "@thirdweb-dev/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );
  const { data: listings, isLoading: loadingListings } =
  useActiveListings(contract);
  const router=useRouter();


  const [search,setSearch]=useState("");
  const [searchResults,setSearchResults]=useState([]);
  const [loader,setLoader]=useState(true);


    const handleSearch=(e)=>{
      setSearchResults([]);
      let tid;
      clearTimeout(tid);
      setLoader(true);
      tid=setTimeout(()=>{
        if(e.target.value!==""){
          setSearch(e.target.value);  
        }
        else
        setSearch("");
      },1000)
    }

    useEffect(()=>{
      listings?.map((ele)=>{
        if(ele.asset.name.toString().toLowerCase().includes(search.trim().toLowerCase())){
          console.log(ele.asset.name,search);
          setSearchResults([...searchResults,ele]);
        }
      })
      setLoader(false)
      console.log(searchResults);
      
    },[search])

  return (
    <>
      <Header search={(e)=>handleSearch(e)} />
      <main className="max-w-6xl mx-auto px-6 py-2">
        {(loadingListings || loader) ? (
          <p className="text-center animate-pulse text-blue-500">
            Loading listings...
          </p>
        ) : (
          <>
           {search && searchResults?.length==0 && <div className="text-center text-lg">No Search Results found for <span className="text-blue-500">"{search}"</span></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mx-auto">
            {(search?searchResults:listings)?.map((listing, idx) => (
              <div
              onClick={()=>router.push(`/listing/${listing.id}`)}
              key={listing.id}
                className="flex flex-col card hover:scale-105 transition-all duration-150 ease-out"
               
              >
                <div className="flex-1 flex flex-col pb-2 items-center">
                  <MediaRenderer className="w-44" src={listing.asset.image} />
                </div>

                <div className="pt-2 space-y-4">
                  <div>
                    <h2 className="text-lg truncate">{listing?.asset?.name}</h2>
                    <hr />
                    <p className="text-sm text-gray-600 mt-2 truncate">
                      {listing?.asset?.description}
                    </p>
                  </div>

                  <p>
                    <span className="font-bold mr-1">
                      {listing.buyoutCurrencyValuePerToken.displayValue}
                    </span>
                    {listing.buyoutCurrencyValuePerToken.symbol}
                  </p>
                  <div className={`flex items-center space-x-1 justify-end text-xs border w-fit ml-auto p-2 text-white ${listing.type===ListingType.Direct?'bg-blue-500':'bg-red-500'}`}>
                    <p>
                      {listing.type === ListingType.Direct
                        ? "Buy Now"
                        : "Auction"}
                    </p>
                    {listing.type===ListingType.Direct?(
                      <BanknotesIcon className="h-4"/>
                    ):(<ClockIcon className="h-4"/>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )
        
        }
      </main>


    </>
  );
}
