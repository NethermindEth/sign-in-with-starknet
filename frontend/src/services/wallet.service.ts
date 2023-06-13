import { connect, disconnect, StarknetWindowObject } from "get-starknet"
import { shortString, constants, hash, typedData, Account, CallData, stark, num, Provider, Contract} from "starknet"
import { ISiwsDomain, ISiwsMessage, SiwsTypedData } from "siws_lib/dist"

const env = process.env.NODE_ENV
let BACKEND_ADDR = "";
if (env == "production"){
  BACKEND_ADDR = "http://143.42.2.9:3001";
}
else if (env == "development"){
  BACKEND_ADDR = "http://localhost:3001";
}

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

export async function createSiwsData(statement:string) {
    const domain = window.location.host;
    const origin = window.location.origin;
    const res = await fetch(`${BACKEND_ADDR}/nonce`, {
        credentials: 'include',
    });
    const responseNonce = await res.text()
    const address= await walletAddress();
 
    const siwsDomain : ISiwsDomain = {version: '0.0.1',
                                   chainId: networkId() as any,
                                    name: 'Sign in Test App'}

    const siwsMessage: ISiwsMessage = {
      domain,
      address,
      statement,
      uri: origin,
      nonce: responseNonce,
      issuedAt: new Date().toISOString()}

    const signindata = new SiwsTypedData(siwsDomain, siwsMessage);
    return signindata
}

export async function verifySignInData(signindata:SiwsTypedData, signature:string[]) {
  const starknet = window.starknet as StarknetWindowObject
  await starknet.enable()

  const res = await fetch(`${BACKEND_ADDR}/verify`, {
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signindata: signindata.toJson(), signature }),
    credentials: 'include'
  });

  if (res.status != 200) {
    const errorJson = await res.json()
    console.log("error json", errorJson)
    throw new Error(errorJson.message);
  }

  return true;
}

export const networkId = (): string | undefined => {
  try {
    const chainId: string = window.starknet?.provider?.chainId === undefined ? constants.StarknetChainId.SN_GOERLI : window.starknet?.provider?.chainId
    if (constants.StarknetChainId.SN_MAIN === chainId) {
      return constants.NetworkName.SN_MAIN
    } else if (constants.StarknetChainId.SN_GOERLI === chainId) {
      return constants.NetworkName.SN_GOERLI
    } else if (constants.StarknetChainId.SN_GOERLI2 === chainId) {
      return constants.NetworkName.SN_GOERLI2
    }
    else {
      return "localhost"
    }
  } catch { }
}

export const networkUrl = (): string | undefined => {
  try {
    return networkId()
  } catch { }
}

export const signMessage = async (signindata: string) => {
  const starknet = window.starknet as StarknetWindowObject
  await starknet.enable()
  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")
  
  let siwsdata = SiwsTypedData.fromJson(signindata)
  const signature = await starknet.account.signMessage(siwsdata)
  return signature
}

export const addWalletChangeListener = async (
  handleEvent: (accounts: string[]) => void,
) => {
  window.starknet?.on("accountsChanged", handleEvent)
}

export const isPreauthorized = async (): Promise<boolean> => {
  return !!window.starknet?.isPreauthorized
}
