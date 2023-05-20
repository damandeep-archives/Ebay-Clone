"use client";
import React, { FormEvent, useRef, useState } from "react";
import Header from "@/components/Header";
import { useAddress, useContract } from "@thirdweb-dev/react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
type Props = {};

function addItem({}: Props) {
  const address = useAddress();
  const router = useRouter();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );

  const [preview, setPreview] = useState<string | File>();
  const [image, setImage] = useState<File>();

  const nftHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!contract || !address) {
      toast.error("Please connect your wallet", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }
    if (!image) {
      toast.error("Please select an image", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    const target = e.target as typeof e.target & {
      name: { value: string };
      description: { value: string };
    };

    const metadata = {
      name: target.name.value,
      description: target.name.value,
      image: image,
    };

    toast.promise(
      mintNFT(metadata),
      {
        pending: "Minting NFT...",
        success: "NFT Minted Successfully",
        error: "Error: Not able to mint NFT",
      },
      { position: toast.POSITION.TOP_CENTER, toastId: 1 }
    );
  };

  const mintNFT = (metadata) => {
    return new Promise(async (res, rej) => {
      try {
        const tx = await contract.mintTo(address, metadata);
        const receipt = tx.receipt;
        const token = tx.id;
        const nft = tx.data;
        res("");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (e) {
        console.log(e);
        rej("");
      }
    });
  };
  return (
    <div>
      <ToastContainer />
      <Header />
      <main className="max-w-6xl mx-auto p-10 border">
        <h1 className="text-4xl font-bold">Add an item to the marketplace</h1>
        <h2 className="text-xl font-semibold pt-5">Item Details</h2>
        <p className="pb-5">
          By adding an item to the marketplace, you're essentially Minting an
          NFT of the item into your wallet which we can then list for sale
        </p>

        <div className="flex flex-col justify-center items-center md:flex-row md:space-x-5 pt-5">
          <img
            className="w-80 h-80 object-contain border"
            src={(preview as string) || "https://links.papareact.com/ucj"}
            alt=""
          />
          <form
            onSubmit={nftHandler}
            className="flex flex-col flex-1 p-2 space-y-2"
          >
            <label className="font-light">Name of Item</label>
            <input
              name="name"
              id="name"
              className="formField"
              type="text"
              placeholder="Name of item..."
            />

            <label className="font-light">Description</label>
            <input
              name="description"
              id="description"
              className="formField"
              type="text"
              placeholder="Enter Description..."
            />

            <label className="font-light">Image of the item</label>
            <input
              onChange={(e) => {
                if (e?.target?.files?.[0]) {
                  setPreview(URL.createObjectURL(e.target.files[0]));
                  setImage(e.target.files[0]);
                }
              }}
              className="mb-10"
              type="file"
            />

            <button
              type="submit"
              className="bg-blue-500 font-bold text-white  py-4 px-10 w-56 md:mt-auto md:ml-auto  mx-auto"
            >
              Add/Mint Item
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default addItem;
