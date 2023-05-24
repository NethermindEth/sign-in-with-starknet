import {  Provider } from "starknet";

import { SiwsMessage } from "./client";

export class SignatureMeta {}

export class Signature {
  t: string; // signature scheme

  m?: SignatureMeta; // signature related metadata (optional)

  s: string[]; // signature
}

// export class Header {
//   /** specifies format of the payload. */
//   t: string;
// }

// export class Payload {
//   /** RFC 4501 dns authority that is requesting the signing. */
//   domain: string;

//   /** Starknet address performing the signing */
//   address: string;

//   /** Human-readable ASCII assertion that the user will sign, and it must not contain newline characters. */
//   statement?: string;

//   /** RFC 3986 URI referring to the resource that is the subject of the signing
//    *  (as in the __subject__ of a claim). */
//   uri: string;

//   /** Current version of the message. */
//   version: string;

//   /** Chain ID to which the session is bound, and the network where
//    * Contract Accounts must be resolved. */
//   chainId?: number;

//   /** Randomized token used to prevent replay attacks, at least 8 alphanumeric
//    * characters. */
//   nonce: string;

//   /** ISO 8601 datetime string of the current time. */
//   issuedAt: string;

//   /** ISO 8601 datetime string that, if present, indicates when the signed
//    * authentication message is no longer valid. */
//   expirationTime?: string;

//   /** ISO 8601 datetime string that, if present, indicates when the signed
//    * authentication message will become valid. */
//   notBefore?: string;

//   /** System-specific identifier that may be used to uniquely refer to the
//    * sign-in request. */
//   requestId?: string;

//   /** List of information or references to information the user wishes to have
//    * resolved as part of authentication by the relying party. They are
//    * expressed as RFC 3986 URIs separated by `\n- `. */
//   resources?: Array<string>;
// }

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
  data: SiwsMessage;
}

export interface VerifyOpts {
  /** ethers provider to be used for EIP-1271 validation */
  provider?: Provider;

  /** If the library should reject promises on errors, defaults to false */
  // suppressExceptions?: boolean;

  // /** Enables a custom verification function that will be ran alongside EIP-1271 check. */
  // verificationFallback?: (params: VerifyParams, opts: VerifyOpts, message: SiweMessage, EIP1271Promise: Promise<SiweResponse>) => Promise<SiweResponse>;
}