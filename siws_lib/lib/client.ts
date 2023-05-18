// import type { StarknetWindowObject } from "get-starknet";
import { ec, hash, typedData, num, Provider, Contract, json, Account, CallData, stark } from "starknet";
// import { TypedData, getMessageHash } from 'starknet';
import { isUri } from "valid-url";


import { ParsedMessage } from "./regex";
import { ErrorTypes,  Payload, Signature, SignInWithStarknetError, SignInWithStarknetResponse, VerifyParams, VerifyOpts } from "./types";
import { randomBytes } from "./util";
import abiAccountContract from "./accountClassAbi.json";

import TypedData = typedData.TypedData;
import getMessageHash = typedData.getMessageHash;
import BigNumberish = num.BigNumberish;

export class SiwsMessage {
  
  // header: Header;

  //  payload: Payload;

  // signature: Signature;
  /** RFC 4501 dns authority that is requesting the signing. */
  domain: string;

  /** Starknet address performing the signing */
  address: string;

  /** Human-readable ASCII assertion that the user will sign, and it must not contain newline characters. */
  statement?: string;

  /** RFC 3986 URI referring to the resource that is the subject of the signing
   *  (as in the __subject__ of a claim). */
  uri: string;

  /** Current version of the message. */
  version: string;

  /** Chain ID to which the session is bound, and the network where
   * Contract Accounts must be resolved. */
  chainId?: number;

  /** Randomized token used to prevent replay attacks, at least 8 alphanumeric
   * characters. */
  nonce: string;

  /** ISO 8601 datetime string of the current time. */
  issuedAt: string;

  /** ISO 8601 datetime string that, if present, indicates when the signed
   * authentication message is no longer valid. */
  expirationTime?: string;

  /** ISO 8601 datetime string that, if present, indicates when the signed
   * authentication message will become valid. */
  notBefore?: string;

  /** System-specific identifier that may be used to uniquely refer to the
   * sign-in request. */
  requestId?: string;

  /** List of information or references to information the user wishes to have
   * resolved as part of authentication by the relying party. They are
   * expressed as RFC 3986 URIs separated by `\n- `. */
  resources?: Array<string>;

  /**
   * Creates a parsed Sign-In with Starknet Message object from a
   * string or an object. If a string is used an parser is called to
   * validate the parameter, otherwise the fields are attributed.
   * @param param {string | SiwsMessage} Sign message as a string or an object.
   */
  constructor(param: string | Partial<SiwsMessage>) {
    if (typeof param === "string") {
      const parsedMessage = new ParsedMessage(param);
      this.domain = parsedMessage.domain;
      this.address = parsedMessage.address;
      this.statement = parsedMessage.statement;
      this.uri = parsedMessage.uri;
      this.version = parsedMessage.version;
      this.nonce = parsedMessage.nonce;
      this.issuedAt = parsedMessage.issuedAt;
      this.expirationTime = parsedMessage.expirationTime;
      this.notBefore = parsedMessage.notBefore;
      this.requestId = parsedMessage.requestId;
      this.chainId = parsedMessage.chainId;
      this.resources = parsedMessage.resources;
    } else {
      Object.assign(this, param);
      if (typeof this.chainId === "string") {
        this.chainId = parseInt(this.chainId);
      }
      if (!this.nonce) {
        this.nonce = randomBytes(8).toString("hex");
      }
      if (!this.issuedAt) {
        this.issuedAt = new Date().toISOString();
      }
    }
  }

  /**
   * This function can be used to retrieve a formated message for
   * signature, although you can call it directly it's advised to use
   * [prepareMessage()] instead which will resolve to the correct method based
   * on the [type] attribute of this object, in case of other formats being
   * implemented.
   * @returns {string} message
   */
  toMessage(): string {
    /** Validates all fields of the object */

    this.validate();

    const header = `${this.domain} wants you to sign in with your Starknet account:`;
    const uriField = `URI: ${this.uri}`;
    let prefix = [header, this.address].join("\n");
    const versionField = `Version: ${this.version}`;
    const chainField = `Chain ID: ${this.chainId || 1}`;
    const nonceField = `Nonce: ${this.nonce}`;
    const suffixArray = [uriField, versionField, chainField, nonceField];
    if (this.issuedAt) {
      Date.parse(this.issuedAt);
    } else {
      this.issuedAt = this.issuedAt ? this.issuedAt : new Date().toISOString();
    }
    suffixArray.push(`Issued At: ${this.issuedAt}`);

    if (this.expirationTime) {
      const expiryField = `Expiration Time: ${this.expirationTime}`;
      suffixArray.push(expiryField);
    }

    if (this.notBefore) {
      suffixArray.push(`Not Before: ${this.notBefore}`);
    }

    if (this.requestId) {
      suffixArray.push(`Request ID: ${this.requestId}`);
    }

    if (this.resources) {
      suffixArray.push([`Resources:`, ...this.resources.map((x) => `- ${x}`)].join("\n"));
    }

    const suffix = suffixArray.join("\n");
    prefix = [prefix, this.statement].join("\n\n");
    if (this.statement) {
      prefix += "\n";
    }
    return [prefix, suffix].join("\n");
  }

  /**
   * This method parses all the fields in the object and creates a sign
   * message according with the type defined.
   * @returns {string} Returns a message ready to be signed according with the
   * type defined in the object.
   */
  prepareMessage(): string {
    let message: string;
    switch (this.version) {
      case "1": {
        message = this.toMessage();
        break;
      }

      default: {
        message = this.toMessage();
        break;
      }
    }
    return message;
  }

  /**
   * Validates the value of this object fields.
   * @throws Throws an {ErrorType} if a field is invalid.
   */
  validate() {
    /** `domain` check. */
    if (this.domain.length === 0 || !/[^#?]*/.test(this.domain)) {
      throw new SignInWithStarknetError(ErrorTypes.INVALID_DOMAIN, `${this.domain} to be a valid domain.`);
    }

    /** Check if the URI is valid. */
    if (!isUri(this.uri)) {
      throw new SignInWithStarknetError(ErrorTypes.INVALID_URI, `${this.uri} to be a valid uri.`);
    }

    /** Check if the version is 1. */
    if (this.version !== "1") {
      throw new SignInWithStarknetError(ErrorTypes.INVALID_MESSAGE_VERSION, "1", this.version);
    }

    /** Check if the nonce is alphanumeric and bigger then 8 characters */
    const nonce = this.nonce.match(/[a-zA-Z0-9]{8,}/);
    if (!nonce || this.nonce.length < 8 || nonce[0] !== this.nonce) {
      throw new SignInWithStarknetError(ErrorTypes.INVALID_NONCE, `Length > 8 (${nonce.length}). Alphanumeric.`, this.nonce);
    }

    const ISO8601 =
      /([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))/;
    /** `issuedAt` conforms to ISO-8601 */
    if (this.issuedAt) {
      if (!ISO8601.test(this.issuedAt)) {
        throw new Error(ErrorTypes.INVALID_TIME_FORMAT);
      }
    }

    /** `expirationTime` conforms to ISO-8601 */
    if (this.expirationTime) {
      if (!ISO8601.test(this.expirationTime)) {
        throw new Error(ErrorTypes.INVALID_TIME_FORMAT);
      }
    }

    /** `notBefore` conforms to ISO-8601 */
    if (this.notBefore) {
      if (!ISO8601.test(this.notBefore)) {
        throw new Error(ErrorTypes.INVALID_TIME_FORMAT);
      }
    }
  }

  public async verifyMessageHash(hash: BigNumberish, signature: string[], provider: Provider): Promise<boolean> {
    try {
      const accountContract = new Contract(abiAccountContract, this.address, provider);

      await accountContract.callContract({
        contractAddress: this.address,
        entrypoint: 'isValidSignature',
        calldata: CallData.compile({
          hash: num.toBigInt(hash).toString(),
          signature: stark.formatSignature(signature),
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  public async verifyMessage(data: typedData.TypedData, signature: string[], provider: Provider): Promise<boolean> {
    const hash = await getMessageHash(data, this.address);
    return this.verifyMessageHash(hash, signature, provider);
  }

  /**
   * Validates the integrity of the object by matching it's signature.
   * @param params Parameters to verify the integrity of the message, signature is required.
   * @returns {Promise<SignInWithStarknetResponse>} This object if valid.
   */
  verify(params: VerifyParams, opts: VerifyOpts ): Promise<SignInWithStarknetResponse> {
    return new Promise<SignInWithStarknetResponse>((resolve, reject) => {
      const { domain, nonce, network, signature } = params;

      /** Domain binding */
      if (domain && domain !== this.domain) {
        resolve({
          success: false,
          data: this,
          error: new SignInWithStarknetError(ErrorTypes.DOMAIN_MISMATCH, domain, this.domain),
        });
      }

      /** Nonce binding */
      if (nonce && nonce !== this.nonce) {
        resolve({
          success: false,
          data: this,
          error: new SignInWithStarknetError(ErrorTypes.NONCE_MISMATCH, nonce, this.nonce),
        });
      }

      /** Check time */
      const checkTime = new Date();

      /** Expiry Checks */
      if (this.expirationTime) {
        const expirationDate = new Date(this.expirationTime);

        // Check if the message hasn't expired
        if (checkTime.getTime() >= expirationDate.getTime()) {
          resolve({
            success: false,
            data: this,
            error: new SignInWithStarknetError(
              ErrorTypes.EXPIRED_MESSAGE,
              `${checkTime.toISOString()} < ${expirationDate.toISOString()}`,
              `${checkTime.toISOString()} >= ${expirationDate.toISOString()}`
            ),
          });
        }
      }

      /** Message is valid already */
      if (this.notBefore) {
        const notBefore = new Date(this.notBefore);
        if (checkTime.getTime() < notBefore.getTime()) {
          resolve({
            success: false,
            data: this,
            error: new SignInWithStarknetError(
              ErrorTypes.EXPIRED_MESSAGE,
              `${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
              `${checkTime.toISOString()} < ${notBefore.toISOString()}`
            ),
          });
        }
      }

      const message = hash.starknetKeccak(this.prepareMessage()).toString(16).substring(0, 31);
      const typedMessage = {
        domain: {
          name: "Example DApp",
          chainId: network === "mainnet-alpha" ? "SN_MAIN" : "SN_GOERLI",
          version: "0.0.1",
        },
        types: {
          StarkNetDomain: [
            { name: "name", type: "felt" },
            { name: "chainId", type: "felt" },
            { name: "version", type: "felt" },
          ],
          Message: [{ name: "message", type: "felt" }],
        },
        primaryType: "Message",
        message: {
          message,
        },
      };

      this.verifyMessage(typedMessage, signature.s, opts.provider)
      .then((valid) => {
        if (!valid)
          return reject({
            success: false,
            data: this,
            error: new SignInWithStarknetError(ErrorTypes.INVALID_SIGNATURE, "Signature verfication failed"),
          });
        return resolve({
          success: true,
          data: this,
        });
      })
      .catch(() => {
        return resolve({
          success: false,
          data: this,
          error: new SignInWithStarknetError(
            ErrorTypes.INVALID_SIGNATURE,
            "Signature verfication failed. Check if you have an account created."
          ),
        });
      });
    });
  }
}
