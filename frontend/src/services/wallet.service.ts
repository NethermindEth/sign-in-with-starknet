import { connect, disconnect, StarknetWindowObject } from "get-starknet"
import { shortString, constants, hash, typedData, Account, CallData, stark, num, Provider, Contract} from "starknet"
import { SiwsMessage } from "siws_lib/dist"
import abiAccountContract from "siws_lib/src/accountClassAbi.json";

const BACKEND_ADDR = "http://localhost:3001";


export const isWalletConnected = (): boolean => {
  if (typeof window === "undefined") {
    return false
  }
  return Boolean(window.starknet?.isConnected)
}

export const connectWallet = async () =>
  await connect({ modalMode: "canAsk" })

export const walletAddress = async (): Promise<string | undefined> => {
  try {
    const address = await window.starknet?.account?.address
    return address
  } catch { }
}

export async function createSiwsMessage(statement:string) {
    const domain = window.location.host;
    const origin = window.location.origin;
    const res = await fetch(`${BACKEND_ADDR}/nonce`, {
        credentials: 'include',
    });
    const responseNonce = await res.text()
    const address= await walletAddress();
    console.log("chain id", parseInt(window.starknet?.provider?.chainId.toString()));
    const message = new SiwsMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: 3/*parseInt( window.starknet?.provider?.chainId.toString())*/,
        nonce: responseNonce
    });
    return message.prepareMessage();
}

export async function verifySignInMessage(message:string, signature:string[]) {
  const starknet = window.starknet as StarknetWindowObject
  await starknet.enable()

  const res = await fetch(`${BACKEND_ADDR}/verify`, {
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, signature }),
    credentials: 'include'
  });
  const result = await res.text();
  return Boolean(JSON.parse(result));
}

export const networkId = (): string | undefined => {
  try {
    const chainId: string = window.starknet?.provider?.chainId === undefined ? constants.StarknetChainId.SN_GOERLI : window.starknet?.provider?.chainId
    if (constants.StarknetChainId.SN_MAIN === chainId) {
      return "mainnet-alpha"
    } else if (constants.StarknetChainId.SN_GOERLI === chainId) {
      return "goerli-alpha"
    } else if (constants.StarknetChainId.SN_GOERLI2 === chainId) {
      return "goerli-alpha2"
    }
    else {
      return "localhost"
    }
  } catch { }
}

export const getExplorerBaseUrl = (): string | undefined => {
  if (networkId() === "mainnet-alpha") {
    return "https://voyager.online"
  } else if (networkId() === "goerli-alpha") {
    return "https://goerli.voyager.online"
  }
}

export const networkUrl = (): string | undefined => {
  try {
    return networkId()
  } catch { }
}

export const signMessage = async (message: string) => {
  const starknet = window.starknet as StarknetWindowObject
  await starknet.enable()
  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")
  // if (!shortString.isShortString(message)) {
  //   throw Error("message must be a short string" + message)
  // }

  message = hash.starknetKeccak(message).toString(16).substring(0, 31);
  console.log("message to sign: " + message)

  const typedMessage = {
    types: {
      StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "chainId", type: "felt" },
        { name: "version", type: "felt" },
      ],
      Message: [
        { name: "message", type: "felt" }
      ],
    },
    primaryType: "Message",
    domain: {
      name: "Example DApp",
      chainId: /*networkId() === "mainnet-alpha" ? "SN_MAIN" :*/ "SN_GOERLI",
      version: "0.0.1",
    },
    message: {
      message,
    },
  }

  const signature = await starknet.account.signMessage(typedMessage)
  console.log("signature: " ,signature)
  return signature
}

export const waitForTransaction = async (hash: string) =>
  await window.starknet?.provider?.waitForTransaction(hash)

export const addWalletChangeListener = async (
  handleEvent: (accounts: string[]) => void,
) => {
  window.starknet?.on("accountsChanged", handleEvent)
}

export const isPreauthorized = async (): Promise<boolean> => {
  return !!window.starknet?.isPreauthorized
}
