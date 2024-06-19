import { connect, disconnect, StarknetWindowObject } from "get-starknet";
import {
  constants,
} from "starknet";
import {
  ISiwsDomain,
  ISiwsMessage,
  ISiwsTypedData,
  SiwsTypedData,
} from "siws_lib/dist";
import { formatAddress } from "./address.service";

const env = process.env.NODE_ENV;
let BACKEND_ADDR = "http://localhost:3001";
if (env == "production") {
  BACKEND_ADDR = "https://siws.nethermind.io/api";
} else if (env == "development") {
  BACKEND_ADDR = "http://localhost:3001";
}

export const isWalletConnected = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(window.starknet?.isConnected);
};

export const connectWallet = async () => await connect({ modalMode: "alwaysAsk" });
export const disconnectWallet = async () => await disconnect();
export const connectWalletSilent = async () => await connect({ modalMode: "neverAsk" });

export async function createSiwsData(statement: string, connection: StarknetWindowObject) {
  const domain = window.location.host;
  const origin = window.location.origin;
  const res = await fetch(`${BACKEND_ADDR}/nonce`, {
    credentials: "include",
  });
  const responseNonce = await res.text();
  const address = connection.selectedAddress ?? connection.account.address;

  const networkName = await networkId(connection);

  const siwsDomain: ISiwsDomain = {
    version: "0.0.1",
    chainId: networkName,
    name: domain,
    revision: "1",
  };

  const siwsMessage: ISiwsMessage = {
    address: formatAddress(address),
    statement,
    uri: origin,
    version: "0.0.5", //message version and not the starknetdomain version
    nonce: responseNonce,
    issuedAt: new Date().toISOString(),
  };

  const signindata = new SiwsTypedData(siwsDomain, siwsMessage);
  return signindata;
}

export async function verifySignInData(
  signindata: SiwsTypedData,
  signature: string[]
) {
  const res = await fetch(`${BACKEND_ADDR}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ signindata: signindata.toJson(), signature }),
    credentials: "include",
  });

  if (res.status != 200) {
    const errorJson = await res.json();
    console.log("error json", errorJson);
    throw new Error(errorJson.message);
  }

  return true;
}

export const networkId = async (connection: StarknetWindowObject): Promise<"SN_MAIN" | "SN_SEPOLIA"> => {
  try {
    const chainId = await connection?.provider?.getChainId();

    if (constants.StarknetChainId.SN_MAIN === (chainId as any)) {
      return constants.NetworkName.SN_MAIN;
    } else if (constants.StarknetChainId.SN_SEPOLIA === (chainId as any)) {
      return constants.NetworkName.SN_SEPOLIA;
    } else {
      return constants.NetworkName.SN_SEPOLIA;
    }
  } catch {
      return constants.NetworkName.SN_SEPOLIA;
  }
};

export const signMessage = async (signindata: ISiwsTypedData, connection: StarknetWindowObject) => {
  // checks that enable succeeded
  if (connection.isConnected === false)
    throw Error("starknet wallet not connected");

  const signature = await connection?.account?.signMessage(signindata);

  if(connection.name === 'Braavos' && Array.isArray(signature)) { 
    if(signature.length > 2) {
      return [...signature].splice(signature.length-2)
    }
  }
  return signature;
};

