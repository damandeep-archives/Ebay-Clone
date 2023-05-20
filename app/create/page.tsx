"use client";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import {
  useAddress,
  useContract,
  MediaRenderer,
  useNetworkMismatch,
  useOwnedNFTs,
  useCreateAuctionListing,
  useCreateDirectListing,
  NFT,
  useSwitchChain,
} from "@thirdweb-dev/react";
import { NATIVE_TOKENS, NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import network from "@/utils/network";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {};

function Create({}: Props) {
  const router = useRouter();
  const bottomPageRef = useRef(null);
  const [selectedNft, setSelectedNft] = useState<NFT>();
  const address = useAddress();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );
  const { contract: collectionContract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );
  useEffect(()=>{
    bottomPageRef?.current?.scrollIntoView({ behavior: 'smooth' })
  },[selectedNft])

  const {
    data: ownedNFTs,
    isLoading: isLoadingOwnedNFTS,
    error,
  } = useOwnedNFTs(collectionContract, address);
  const {
    mutate: createDirectListing,
    isLoading: isLoadingDirect,
    error: errorDirect,
  } = useCreateDirectListing(contract);
  const {
    mutate: createAuctionListing,
    isLoading: isLoadingAuction,
    error: errorAuction,
  } = useCreateAuctionListing(contract);
  const networkMismatch = useNetworkMismatch();
  const switchNetwork = useSwitchChain();

  const handleCreateListing = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (networkMismatch) {
      switchNetwork(network);
      return;
    }

    if (!selectedNft) return;

    const target = e.target as typeof e.target & {
      elements: {
        listingType: { value: string };
        price: { value: string };
      };
    };

    const { listingType, price } = target.elements;
    if (listingType.value === "directListing") {
      toast.promise(
        placeDirectListing(price),
        {
          pending: "Creating Listing...",
          success: "NFT Listed Successfully on marketplace",
          error: "Error: Not able to list NFT",
        },
        { position: toast.POSITION.TOP_CENTER, toastId: 1 }
      );
    } else if (listingType.value === "auctionListing") {
      toast.promise(
        placeAuctionListing(price),
        {
          pending: "Creating Listing...",
          success: "NFT Listed Successfully on marketplace",
          error: "Error: Not able to list NFT",
        },
        { position: toast.POSITION.TOP_CENTER, toastId: 1 }
      );
    }
  };

  const placeAuctionListing = (price) => {
    return new Promise(async (res, rej) => {
      await createAuctionListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          tokenId: selectedNft.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price.value,
          startTimestamp: new Date(),
          reservePricePerToken: 0,
        },
        {
          onSuccess(data, variables, context) {
            console.log("SUCCESS", data, variables, context);
            res('');
            setTimeout(()=>{
                router.push("/");
            },4000)
          },
          onError(error, variables, context) {
            console.log("ERROR", error, variables, context);
            rej('');
          },
        }
      );
    });
  };
  const placeDirectListing = (price) => {
    return new Promise(async (res, rej) => {
      await createDirectListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          tokenId: selectedNft.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price.value,
          startTimestamp: new Date(),
        },
        {
          onSuccess(data, variables, context) {
            console.log("SUCCESS", data, variables, context);
            res("");
            setTimeout(() => {
              router.push("/");
            }, 4000);
          },
          onError(error, variables, context) {
            rej("");
            console.log("ERROR", error, variables, context);
          },
        }
      );
    });
  };

  return (
    <div>
      <ToastContainer />
      <Header />
      <main className="max-w-6xl mx-auto p-10 pt-2">
        <h1 className="text-2xl font-bold">List an item</h1>
        <h2 className="text-xl font-semibold pt-5">
          Select an item you would like to sell
        </h2>
        <hr className="mb-5" />
        <p>Below you will find the NFTs that you own in your wallet</p>
        {!address && (
          <p className="text-center text-lg my-5 text-red-500/70">
            Please connect your wallet in order to see your owned NFTs.
          </p>
        )}
        {isLoadingOwnedNFTS && address && (
          <p className="text-center animate-pulse text-blue-500">
            Loading listings...
          </p>
        )}
        <div className="flex overflow-x-scroll space-x-2 p-4">
          {ownedNFTs?.map((nft) => (
            <div
              onClick={() => {setSelectedNft(nft)}}
              className={`flex flex-col space-y-2 card min-w-fit border-2 bg-gray-100  ${
                nft?.metadata?.id === selectedNft?.metadata?.id
                  ? "border-black"
                  : "border-transparent"
              }`}
              key={nft.metadata.id}
            >
              <MediaRenderer
                className="h-48 rounded-lg"
                src={nft.metadata.image}
              />
              <p className="text-lg truncate font-bold">{nft.metadata.name}</p>
              <p className="text-xs truncate">{nft.metadata.description}</p>
            </div>
          ))}
        </div>

        {selectedNft && (
          <form onSubmit={handleCreateListing}>
            <div className="flex flex-col p-10">
              <div className=" grid grid-cols-2 gap-5">
                <label className="border-r font-light">
                  Direct Listing / Fixed Price
                </label>
                <input
                  className="ml-auto h-10 w-10"
                  type="radio"
                  name="listingType"
                  value="directListing"
                />

                <label className="border-r font-light">Auction</label>
                <input
                  className="ml-auto h-10 w-10"
                  type="radio"
                  name="listingType"
                  value="auctionListing"
                />

                <label className="border-r font-light">Price</label>
                <input
                  name="price"
                  className="bg-gray-100 p-5"
                  type="text"
                  placeholder="0.05"
                />
              </div>
              <button
                type="submit"
                className="text-white rounded-lg p-4 bg-blue-600 mt-8"
              >
                Create Listing
              </button>
            </div>
            <div ref={bottomPageRef} />
          </form>
        )}
      </main>
    </div>
  );
}

export default Create;
