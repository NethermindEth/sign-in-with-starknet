import { RpcProvider, constants } from "starknet";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import Session from "express-session";
import { randomStringForEntropy } from "@stablelib/random";
import {
  ErrorTypes,
  SignInWithStarknetError,
  SignInWithStarknetResponse,
  VerifyParams,
} from "siws_lib/dist/";
import { SiwsTypedData } from "siws_lib/dist";
import { error } from "console";

/* providers for SN_MAIN, SN_GOERLI, SN_SEPOLIA */

const goerliProvider = new RpcProvider({
  nodeUrl: constants.NetworkName.SN_GOERLI,
});

const sepoliaProvider = new RpcProvider({
  nodeUrl: "https://starknet-sepolia.public.blastapi.io",
});

const mainProvider = new RpcProvider({
  nodeUrl: "https://starknet-mainnet.public.blastapi.io",
});

const oneDay = 1000 * 60 * 60 * 24;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3001",
      "http://143.42.2.9:3000",
      "https://143.42.2.9:3000",
    ],
    credentials: true,
  })
);
app.use(
  Session({
    name: "siws-quickstart",
    secret: "siws-quickstart-secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true, maxAge: oneDay },
  })
);

app.use(express.static("public"));

//import css without conflict


const generateNonce = () => {
  const nonce = randomStringForEntropy(96);
  if (!nonce || nonce.length < 8) {
    throw new Error("Error during nonce creation.");
  }
  return nonce;
};

app.get("/nonce", function(req, res) {
  (req["session"] as any).nonce = generateNonce();
  res.setHeader("Content-Type", "text/plain");
  res["status"](200).send((req["session"] as any).nonce);
  console.log("nonce", (req["session"] as any).nonce);
});

app.post("/verify", async function(req: Request, res: Response) {
  try {
    console.log("req body", req["body"]);

    if (!req["body"].signindata) {
      res["status"](422).json({
        message: "Expected signindata object as body.",
      });
      return;
    }

    const signindata = SiwsTypedData.fromJson(req["body"].signindata);

    const nonce = (req["session"] as any).nonce;
    const signature = req["body"].signature;

    const chainId = signindata.domain.chainId;

    console.log(signindata);
    console.log("signature", req["body"].signature);
    console.log("req session nonce ", nonce);
    console.log("siws nonce ", signindata.message.nonce);

    if (nonce == null) {
      throw new Error("Nonce was not provided in the session");
    }

    if (signature == null) {
      throw new Error("Signature was not provided");
    }

    let starknetProvider = goerliProvider;
    if (chainId == constants.NetworkName.SN_MAIN) {
      starknetProvider = mainProvider;
    } else if (chainId == constants.NetworkName.SN_SEPOLIA) {
      starknetProvider = sepoliaProvider;
    } else if (chainId != constants.NetworkName.SN_GOERLI) {
      starknetProvider = goerliProvider;
    } else {
      throw new Error("Invalid chainId");
    }

    console.log("signature", signature);
    console.log("nonce", nonce);
    console.log("network", chainId);

    const isVerified = await signindata.verify(
      {
        signature: signature,
        nonce: nonce,
        network: chainId,
      },
      { provider: starknetProvider as any }
    );
    (req["session"] as any).siws = signindata;
    // req['session'].cookie.expires = new Date(signindata.message.expirationTime);

    if (isVerified.success) {
      console.log("Verified!");
    } else {
      throw new Error("Not Verified! Something went wrong.");
    }
    req["session"].save(() => res["status"](200).send(true));
  } catch (e) {
    (req["session"] as any).siws = null;
    //        (req['session'] as any).nonce = null; // UN COMMENT THIS LINE IN PRODUCTION. ONLY FOR DEMONSRTATION PURPOSES
    console.log(e);
    if (e.error instanceof SignInWithStarknetError) {
      console.log("SignInWithStarknetError type: ", e.error);
      switch (e.error.type) {
        case ErrorTypes.EXPIRED_MESSAGE: {
          req["session"].save(() =>
            res["status"](440).json({ message: e.error.type })
          );
          break;
        }
        case ErrorTypes.INVALID_SIGNATURE: {
          req["session"].save(() =>
            res["status"](422).json({ message: e.error.type })
          );
          break;
        }
        default: {
          req["session"].save(() =>
            res["status"](500).json({ message: e.error.type })
          );
          break;
        }
      }
    } else {
      req["session"].save(() =>
        res["status"](500).json({ message: e.message })
      );
    }
  }
});

app.get("/personal_information", function(req, res) {
  if (!(req["session"] as any).siws) {
    res["status"](401).json({ message: "You have to first sign_in" });
    return;
  }
  console.log("User is authenticated!");
  res.setHeader("Content-Type", "text/plain");
  res.send(
    `You are authenticated and your address is: ${
      (req["session"] as any).siws.address
    }`
  );
});

const PORT = 3001;
console.log("Listening on port", PORT);
app.listen(3001);
