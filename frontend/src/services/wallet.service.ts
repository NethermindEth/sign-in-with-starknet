import { connect, disconnect, StarknetWindowObject } from "get-starknet"
import { shortString, constants, hash, typedData, Account, CallData, stark, num, Provider, Contract} from "starknet"
import { SiwsMessage } from "siws_lib/dist"
import abiAccountContract from "siws_lib/src/accountClassAbi.json";
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
  
  let siws = new SiwsMessage(message);
  // if (!shortString.isShortString(message)) {
  //   throw Error("message must be a short string" + message)
  // }

  // message = hash.starknetKeccak(message).toString(16).substring(0, 31);
  // console.log("message to sign: " + message)
  // { name: "id", type: "felt" },
  // { name: "from", type: "felt" },
  // { name: "amount", type: "felt" },
  // { name: "nameGamer", type: "string" },
  // { name: "endDate", type: "felt" },



  // domain: string;
  // /** Starknet address performing the signing */
  // address: string;
  // /** Human-readable ASCII assertion that the user will sign, and it must not contain newline characters. */
  // statement?: string;
  // /** RFC 3986 URI referring to the resource that is the subject of the signing
  //  *  (as in the __subject__ of a claim). */
  // uri: string;
  // /** Current version of the message. */
  // version: string;
  // /** Chain ID to which the session is bound, and the network where
  //  * Contract Accounts must be resolved. */
  // chainId?: number;
  // /** Randomized token used to prevent replay attacks, at least 8 alphanumeric
  //  * characters. */
  // nonce: string;
  // /** ISO 8601 datetime string of the current time. */
  // issuedAt: string;



  /** ISO 8601 datetime string that, if present, indicates when the signed
   * authentication message is no longer valid. */
 // expirationTime?: string;
  /** ISO 8601 datetime string that, if present, indicates when the signed
   * authentication message will become valid. */
  //notBefore?: string;
  /** System-specific identifier that may be used to uniquely refer to the
   * sign-in request. */
//  requestId?: string;
  /** List of information or references to information the user wishes to have
   * resolved as part of authentication by the relying party. They are
   * expressed as RFC 3986 URIs separated by `\n- `. */
//  resources?: Array<string>;
  console.log("siws json", siws.toJSON());
  const typedMessage = siws.prepareMessage712StyleTyped();
  console.log("typedMessage: " ,siws.prepareMessage712StyleTyped());

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
