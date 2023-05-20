"use client";
import Header from "@/components/Header";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import network from "@/utils/network";
import {
  ListingType,
  MediaRenderer,
  NATIVE_TOKENS,
  useAcceptDirectListingOffer,
  useAddress,
  useBuyNow,
  useContract,
  useListing,
  useMakeBid,
  useMakeOffer,
  useNetworkMismatch,
  useOffers,
  useSwitchChain,
} from "@thirdweb-dev/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Countdown from "react-countdown";
import { ethers } from "ethers";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {};

export default function Listing({}: Props) {
  const router = useRouter();
  const address = useAddress();
  const search = usePathname();
  const id = search.slice(9);
  const [minimumNextBid, setMinimumNextBid] = useState<{
    displayValue: string;
    symbol: string;
  }>();
  const [bidAmount, setBidAmount] = useState("");
  const networkMismatch = useNetworkMismatch();
  const switchNetwork = useSwitchChain();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );
  const { mutate: makeBid } = useMakeBid(contract);
  const { mutate: buyNow } = useBuyNow(contract);
  const { mutate: makeOffer } = useMakeOffer(contract);
  const { data: offers } = useOffers(contract, id);
  const { data: listing, isLoading, error } = useListing(contract, id);
  const { mutate: acceptOffer } = useAcceptDirectListingOffer(contract);
  const formatPlaceholder = () => {
    if (!listing) return;

    if (listing.type == ListingType.Direct) return "Enter the offer amount";

    if (listing.type == ListingType.Auction) {
      return Number(minimumNextBid?.displayValue) === 0
        ? "Enter Bid Amount"
        : `${minimumNextBid?.displayValue} ${minimumNextBid?.symbol} or more`;
    }
  };

  useEffect(() => {
    if (!id || !contract || !listing) return;

    if (listing.type === ListingType.Auction) {
      fetchMinimumNextBid();
    }
  }, [listing, id, contract]);

  const fetchMinimumNextBid = async () => {
    if (!listing || !contract || !id) return;

    const minBidResponse = await contract.auction.getMinimumNextBid(id);

    setMinimumNextBid({
      displayValue: minBidResponse.displayValue,
      symbol: minBidResponse.symbol,
    });
  };

  const buyNFT = async () => {
    if (networkMismatch) {
      switchNetwork(network);
      return;
    }

    if (!id || !contract || !listing || !network) {
      if (!contract || !network)
        toast.error("Please connect your wallet", {
          position: toast.POSITION.TOP_CENTER,
        });
      return;
    }

    toast.promise(
      buyInstantly(),
      {
        pending: "Buying NFT...",
        success: "NFT Bought Successfully",
        error: "Error: Not able to buy NFT",
      },
      { position: toast.POSITION.TOP_CENTER, toastId: 1 }
    );
  };

  const buyInstantly = () => {
    return new Promise(async (res, rej) => {
      await buyNow(
        { buyAmount: 1, type: listing.type, id: id },
        {
          onSuccess(data, variable, context) {
            console.log("Success", data);
            res("");
            setTimeout(() => {
              router.replace("/");
            }, 4000);
          },
          onError(error, variables, context) {
            console.log("Error", error, variables, context);
            rej("");
          },
        }
      );
    });
  };

  const createBidOrOffer = async () => {
    try {
      if (networkMismatch) {
        switchNetwork(network);
        return;
      }
      if (!network) {
        toast.error("Please connect your wallet", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      // Direct
      if (listing?.type == ListingType.Direct) {
        if (
          listing?.buyoutPrice?.toString() ===
          ethers?.utils?.parseEther(bidAmount)?.toString()
        ) {
          buyNFT();
          return;
        }
        console.log('HERE');
        
        toast.promise(
          placeOffer(),
          {
            pending: "Placing Offer...",
            success: "Offer Placed Successfully",
            error: "Error: Not able to place Offer",
          },
          { position: toast.POSITION.TOP_CENTER, toastId: 1 }
        );
      }

      // Auction
      if (listing?.type == ListingType.Auction) {
        toast.promise(
          placeBid(),
          {
            pending: "Placing Offer...",
            success: "Offer Placed Successfully",
            error: "Error: Not able to place Offer",
          },
          { position: toast.POSITION.TOP_CENTER, toastId: 1 }
        );
      }
    } catch (e) {
      toast.error("Error: "+e, {
        position: toast.POSITION.TOP_CENTER,
      });
      console.log(e);
    }
  };

  const placeOffer = () => {
    console.log('IM HERE',bidAmount);
    return new Promise(async (res, rej) => {
      await makeOffer(
        { quantity: 1, listingId: id, pricePerToken: bidAmount },
        {
          onSuccess(data, variables, context) {
            res("");
            console.log("Success", data, variables, context);
          },
          onError(error, variables, context) {
            rej("");
            console.log("Error", error, variables, context);
          },
        }
      );
    });
  };

  const handleAcceptOffer = (offer) => {
    toast.promise(
      new Promise((res, rej) => {
        acceptOffer(
          {
            listingId: id,
            addressOfOfferor: offer.offeror,
          },
          {
            onSuccess(data, variables, context) {
              console.log("Success", data, variables, context);
              res("");
              setTimeout(() => {
                router.replace("/");
              }, 4000);
            },
            onError(error, variables, context) {
              rej();
              console.log("Error", error, variables, context);
            },
          }
        );
      }),
      {
        pending: "Accepting Offer...",
        success: "Offer Accept Successfully",
        error: "Error: Not able to accept offer",
      },
      { position: toast.POSITION.TOP_CENTER, toastId: 1 }
    );
  };
  const placeBid = () => {
    return new Promise(async (res, rej) => {
      await makeBid(
        {
          listingId: id,
          bid: bidAmount,
        },
        {
          onSuccess(data, variables, context) {
            console.log("Success", data, variables, context);
            setBidAmount("");
            res("");
          },
          onError(error, variables, context) {
            console.log("Error", error, variables, context);
            rej("");
          },
        }
      );
    });
  };

  if (isLoading)
    return (
      <>
        <Header />
        <div className="text-center animate-pulse text-blue-500">
          Loading...
        </div>
      </>
    );

  if (!listing) return <div>Listing Not Found</div>;

  return (
    <div>
      <ToastContainer />
      <Header />
      <main className="max-w-6xl mx-auto p-2 flex flex-col lg:flex-row sm:space-y-10 sm:space-x-5">
        <div className="p-10 border mx-auto lg:mx-0 max-w-md lg:max-w-xl">
          <MediaRenderer src={listing?.asset?.image} />
        </div>
        <div className="flex flex-col flex-1 space-y-5 pb-20 lg:pb-0">
          <div>
            <h1 className="text-xl font-bold">{listing.asset.name}</h1>
            <p className="text-gray-600">{listing.asset.description}</p>
            <p className="flex items-center text-xs sm:text-base">
              <UserCircleIcon className="h-5" />
              <span className="font-bold pr-1">Seller: </span>
              {listing.sellerAddress}
            </p>
          </div>
          <div className="grid grid-cols-2 items-center py-2">
            <p className="font-bold">Listing Type</p>
            <p>
              {listing.type === ListingType.Direct
                ? "Direct Listing"
                : "Auction Listing"}
            </p>
            <p>Buy it Now Price: </p>
            <p className="break-words text-xl font-bold">
              {listing.buyoutCurrencyValuePerToken.displayValue}{" "}
              {listing.buyoutCurrencyValuePerToken.symbol}
            </p>
            <button
              onClick={buyNFT}
              className="col-start-2 mt-2 bg-blue-600 font-bold text-white  w-44 py-2 px-10"
            >
              Buy Now
            </button>
          </div>

          {/* If Direct show offers here */}
          {listing.type === ListingType.Direct && offers && (
            <div className="grid grid-cols-2 gap-y-2">
              <p className="font-bold">Offers: </p>
              <p className="font-bold">
                {offers.length > 0 ? offers.length : 0}
              </p>

              {offers!.map((offer) => (
                <>
                  <p className="flex items-center text-sm italic">
                    <UserCircleIcon className="h-3 mr-2" />
                    {offer?.offeror?.slice(0, 5) +
                      "..." +
                      offer?.offeror?.slice(-5)}
                  </p>
                  <div>
                    <p
                      key={
                        offer.listingId +
                        offer.offeror +
                        offer.totalOfferAmount.toString()
                      }
                      className="text-sm italic"
                    >
                      {ethers.utils.formatEther(offer.totalOfferAmount)}
                      {""}
                      {NATIVE_TOKENS[network].symbol}
                    </p>
                    {listing.sellerAddress === address && (
                    <button
                      className="p-2 w-32 bg-red-500/50 rounded-lg font-bold text-xs cursor-pointer"
                      onClick={() => handleAcceptOffer(offer)}
                    >
                      Accept Offer
                    </button>
                  )}
                  </div>
                 
                </>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 space-y-2 items-center justify-end">
            <hr className="col-span-2" />
            <p className="col-span-2 font-bold">
              {listing.type == ListingType.Direct
                ? "Make an Offer"
                : "Bid on this auction"}
            </p>
            {/* Remaining time on auction */}

            {listing.type === ListingType.Auction && (
              <>
                <p>Current Minimum Bid:</p>
                <p>
                  {minimumNextBid?.displayValue} {minimumNextBid?.symbol}
                </p>
                <p>Time Remaining</p>
                <Countdown
                  date={Number(listing.endTimeInEpochSeconds.toString()) * 1000}
                />
              </>
            )}
            <input
              className="border p-2  mr-5 "
              type="text"
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={formatPlaceholder()}
            />
            <button
              onClick={() => createBidOrOffer()}
              className="bg-red-600 font-bold text-white  w-44 py-2 px-10"
            >
              {listing.type === ListingType.Direct ? "Offer" : "Bid"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
