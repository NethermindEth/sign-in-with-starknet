import {  Provider } from "starknet";

export interface SIWSDomain extends Record<string, unknown> {
  chainId: 'SN_GOERLI' | 'SN_GOERLI2' | 'SN_MAIN';
  name: string;
  version: string;
}

export interface SIWSMessage extends Record<string, unknown> {
  address: string;
  domain: string;
  issuedAt: string;
  nonce: string;
  statement: string;
  uri: string;
}

export interface ISIWSTypedData {
  domain: SIWSDomain;
  message: SIWSMessage;
  primaryType: string;
  types: {
      Message: Array<{ name: string; type: string }>;
      StarkNetDomain: Array<{ name: string; type: string }>;
  };
}


export enum ErrorTypes {
  /** `expirationTime` is present and in the past. */
  EXPIRED_MESSAGE = "Expired message.",

  /** `domain` is not a valid authority or is empty. */
  INVALID_DOMAIN = "Invalid domain.",

  /** `domain` don't match the domain provided for verification. */
  DOMAIN_MISMATCH = "Domain do not match provided domain for verification.",

  /** `nonce` don't match the nonce provided for verification. */
  NONCE_MISMATCH = "Nonce do not match provided nonce for verification.",

  /** `address` is not a valid address. */
  INVALID_ADDRESS = "Invalid address.",

  /** `uri` does not conform to RFC 3986. */
  INVALID_URI = "URI does not conform to RFC 3986.",

  /** `nonce` is smaller than 8 characters or is not alphanumeric */
  INVALID_NONCE = "Nonce size smaller than 8 characters or is not alphanumeric.",

  /** `notBefore` is present and in the future. */
  NOT_YET_VALID_MESSAGE = "Message is not valid yet.",

  /** Signature doesn't match the address of the message. */
  INVALID_SIGNATURE = "Signature do not match address of the message.",

  /** `expirationTime`, `notBefore` or `issuedAt` not complient to ISO-8601. */
  INVALID_TIME_FORMAT = "Invalid time format.",

  /** `version` is not 1. */
  INVALID_MESSAGE_VERSION = "Invalid message version.",

  /** Thrown when some required field is missing. */
  UNABLE_TO_PARSE = "Unable to parse the message.",

  MALFORMED_SESSION = "Malformed Session",
}

/**
 * Interface used to return errors in Responses.
 */
export class SignInWithStarknetError extends Error {
  /** Type of the error. */
  type: ErrorTypes;

  /** Expected value or condition to pass. */
  expected?: string;

  /** Received value that caused the failure. */
  received?: string;

  constructor(type: ErrorTypes, expected?: string, received?: string) {
    super(type);
    this.type = type;
    this.expected = expected;
    this.received = received;
  }
}

export interface VerifyParams {
  // payload: Payload;
  signature: string[];
  network?: string;
  // kp: KeyPair | StarknetWindowObject;

  /** RFC 4501 dns authority that is requesting the signing. */
  domain?: string;
  
  /** Randomized token used to prevent replay attacks, at least 8 alphanumeric characters. */
  nonce?: string;
  
  /**ISO 8601 datetime string of the current time. */
  time?: string;
  
}

/**
 * Returned on verifications.
 */
export interface SignInWithStarknetResponse {
  /** Boolean representing if the message was verified with success. */
  success: boolean;

  /** If present `success` MUST be false and will provide extra information on the failure reason. */
  error?: SignInWithStarknetError;

  /** Original message that was verified. */
  data: ISIWSTypedData;
}

export interface VerifyOpts {
  /** ethers provider to be used for EIP-1271 validation */
  provider?: Provider;

  /** If the library should reject promises on errors, defaults to false */
  // suppressExceptions?: boolean;

  // /** Enables a custom verification function that will be ran alongside EIP-1271 check. */
  // verificationFallback?: (params: VerifyParams, opts: VerifyOpts, message: SiweMessage, EIP1271Promise: Promise<SiweResponse>) => Promise<SiweResponse>;
}
