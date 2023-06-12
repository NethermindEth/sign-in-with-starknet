import Ajv2020 from "ajv/dist/2020"
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import schema from './sign-in-schema.json';
import abiAccountContract from "./account-contract-abi.json";
import { ErrorTypes, SignInWithStarknetError, SignInWithStarknetResponse, VerifyParams, VerifyOpts } from "./types";
import {typedData, num, Provider, Contract, } from "starknet";
import { ISIWSTypedData, SIWSDomain, SIWSMessage } from "./types";

import TypedData = typedData.TypedData;
import getMessageHash = typedData.getMessageHash;
import BigNumberish = num.BigNumberish;

  
export class SIWSTypedData implements ISIWSTypedData {
    domain: SIWSDomain;
    message: SIWSMessage;
    primaryType: string;
    types: {
      Message: Array<{ name: string; type: string }>;
      StarkNetDomain: Array<{ name: string; type: string }>;
    };
  
    constructor(domain: SIWSDomain, message: SIWSMessage) {
        const ajv = new Ajv2020({ allErrors: true, strict: true });
        addFormats(ajv);
        ajvErrors(ajv);

      const validate = ajv.compile(schema);
  
      this.domain = domain;
      this.message = message;
      this.primaryType = "Message";
      this.types = {
        Message: [
          { name: "domain", type: "string" },
          { name: "address", type: "felt" },
          { name: "statement", type: "string" },
          { name: "uri", type: "string" },
          { name: "nonce", type: "string" },
          { name: "issuedAt", type: "string" },
        ],
        StarkNetDomain: [
          { name: "name", type: "felt" },
          { name: "chainId", type: "felt" },
          { name: "version", type: "felt" },
        ],
      };

      const dataForValidation = {
        domain: domain,
        message: message,
        primaryType: this.primaryType,
        types: this.types
      };
  
      // Perform validation
      if (!validate(dataForValidation)) {
        const errors = validate.errors;
        // console.log(validate.errors);
        const errorMessage = errors.map((error) => `${error.instancePath} ${error.message}`).join('. ');
        throw new SignInWithStarknetError(
          errorMessage as ErrorTypes,
          )
      }
    }
  
    // Method to convert the object to a JSON string
    toJson(): string {
      return JSON.stringify(this);
    }
  
    // Static method to create an instance from a JSON blob
    public static fromJson(json: string): SIWSTypedData {
      const obj = JSON.parse(json);
      return new SIWSTypedData(obj.domain, obj.message);
    }

    public async verifyMessageHash(hash: BigNumberish, signature: string[], provider: Provider): Promise<boolean> {
        try {
          const accountContract = new Contract(abiAccountContract, this.message.address, provider);
          await accountContract.call("isValidSignature", [hash, signature]);
          return true;
        } catch (e){
          console.log(e);
          return false;
        }
      }
    
      public async verifyMessage(data: typedData.TypedData, signature: string[], provider: Provider): Promise<boolean> {
        const hash = await getMessageHash(data, this.message.address);
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
          if (domain && domain !== this.message.domain) {
            reject({
              success: false,
              data: this,
              error: new SignInWithStarknetError(ErrorTypes.DOMAIN_MISMATCH, domain, this.message.domain),
            });
          }
    
          /** Nonce binding */
          if (nonce && nonce !== this.message.nonce) {
            reject({
              success: false,
              data: this,
              error: new SignInWithStarknetError(ErrorTypes.NONCE_MISMATCH, nonce, this.message.nonce),
            });
          }
    
          /** Check time */
          const checkTime = new Date();
    
          /** Expiry Checks */
          // if (this.expirationTime) {
          //   const expirationDate = new Date(this.expirationTime);
    
          //   // Check if the message hasn't expired
          //   if (checkTime.getTime() >= expirationDate.getTime()) {
          //     resolve({
          //       success: false,
          //       data: this,
          //       error: new SignInWithStarknetError(
          //         ErrorTypes.EXPIRED_MESSAGE,
          //         `${checkTime.toISOString()} < ${expirationDate.toISOString()}`,
          //         `${checkTime.toISOString()} >= ${expirationDate.toISOString()}`
          //       ),
          //     });
          //   }
          // }
    
          // /** Message is valid already */
          // if (this.notBefore) {
          //   const notBefore = new Date(this.notBefore);
          //   if (checkTime.getTime() < notBefore.getTime()) {
          //     resolve({
          //       success: false,
          //       data: this,
          //       error: new SignInWithStarknetError(
          //         ErrorTypes.EXPIRED_MESSAGE,
          //         `${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
          //         `${checkTime.toISOString()} < ${notBefore.toISOString()}`
          //       ),
          //     });
          //   }
          // }
    
          // const message = hash.starknetKeccak(this.prepareMessage()).toString(16).substring(0, 31);
    
          this.verifyMessage(this, signature, opts.provider)
          .then((valid) => {
            if (!valid)
              return reject({
                success: false,
                data: this,
                error: new SignInWithStarknetError(ErrorTypes.INVALID_SIGNATURE, "Signature verification failed"),
              });
            return resolve({
              success: true,
              data: this,
            });
          })
          .catch(() => {
            return reject({
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
  