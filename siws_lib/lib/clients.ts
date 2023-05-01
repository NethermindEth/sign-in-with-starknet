
import * as uri from 'valid-url';

// export class SiwsDomain {

// }

export class SiwsMessage {
    domain: {
        name: "Example DApp",
        chainId: networkId() === "mainnet-alpha" ? "SN_MAIN" : "SN_GOERLI",
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

constructor(param: string | Partial<SiweMessage>) {
    if (typeof param === 'string') {
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
    }
}
}  