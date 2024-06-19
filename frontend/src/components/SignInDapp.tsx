import { FC, useEffect, useState } from "react";

import {
  signMessage,
  createSiwsData,
  verifySignInData,
} from "../services/wallet.service";

import styles from "../styles/Home.module.css";
import MessageEditor from "./MessageEditor";
import { SiwsTypedData } from "siws_lib/dist";
import { Spinner, Code } from "@chakra-ui/react";
import { StarknetWindowObject } from "get-starknet";

export const SignInDapp: FC<{connection: StarknetWindowObject}> = ({ connection }) => {
  // const [shortText, setShortText] = useState("Please sign in")
  const [lastSig, setLastSig] = useState<string[]>([]);
  const [signInData, setSignInData] = useState<SiwsTypedData>();
  const [clientSideMessageError, setClientSideMessageError] = useState<
    string | undefined
  >(undefined);
  const [serverSideMessageError, setServerSideMessageError] = useState<
    string | undefined
  >(undefined);

  const [logginIn, setLoggingIn] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const createSignInData = async () => {
      const loginString =
        "Starknet enables scalable and secure execution of complex computations on Ethereum, revolutionizing decentralized applications.";
      let siwsData = await createSiwsData(loginString, connection);
      return siwsData;
    };
    createSignInData()
      .then((siwsData) => {
        setSignInData(siwsData);
      })
      .catch((e) => console.error(e));
  }, [connection]);

  const handleSignSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      const result: any = await signMessage(signInData, connection);
      setLastSig(result);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setSignedIn(false);
      setLoggingIn(true);
      setServerSideMessageError(null);
      const verified = await verifySignInData(signInData, lastSig);
      setSignedIn(verified);
    } catch (e) {
      console.error(e);
      setSignedIn(false);
      setServerSideMessageError(e.message);
    }
    setLoggingIn(false);
  };

  return (
    <>
      <form>
        <h2 className={styles.title}>Edit your message</h2>
        {
          <MessageEditor
            data={signInData}
            onResult={(signindata: SiwsTypedData) => {
              try {
                setSignInData(signindata);
                // let validatedMessage = SiwsTypedData.fromJson(signindata)
                setClientSideMessageError(null);
              } catch (e) {
                console.error(e);
                setClientSideMessageError(
                  e.message +
                    " \n You can try signing in with the message but since there were validation issues you might not be able to sign in."
                );
              }
            }}
            onError={(e: string) => {
              setClientSideMessageError(e);
            }}
          />
        }
        {clientSideMessageError && (
          <Code color={"red"} backgroundColor={"white"}>
            {clientSideMessageError}
          </Code>
        )}
      </form>
      {
        <div className="columns">
          <form onSubmit={handleSignSubmit}>
            <h2 className={styles.title}>Sign</h2>

            {/* <label htmlFor="Short-Text">Short Text(limited to 31 ascii characters)</label>
          <input
            type="text" 
            id="short-text"
            name="short-text"
            value={shortText}
            onChange={(e) => setShortText(e.target.value)}
            placeholder={shortText}
          /> */}

            <input
              type="submit"
              value="Sign"
              disabled={clientSideMessageError != null}
            />
          </form>
          <form>
            <h2 className={styles.title}>Sign results</h2>

            {/* Label and textarea for value r */}
            <label htmlFor="r">r</label>
            <textarea
              className={styles.textarea}
              id="r"
              name="r"
              value={lastSig[0]}
              onChange={(e) => setLastSig([e.target.value, lastSig[1]])}
            />
            {/* Label and textarea for value s */}
            <label htmlFor="s">s</label>
            <textarea
              className={styles.textarea}
              id="s"
              name="s"
              value={lastSig[1]}
              onChange={(e) => setLastSig([lastSig[0], e.target.value])}
            />
          </form>
        </div>
      }

      {
        <form onSubmit={handleVerifySubmit}>
          <h2 className={styles.title}>
            Verify and Sign In{" "}
            {logginIn && <Spinner color="white.500" size="xl" width={30} />}
          </h2>
          {/* Label and textarea for value r */}
          <label htmlFor="Verify and Sign In"></label>
          {/* Label and textarea for value s */}
          <input
            type="submit"
            value="Sign In"
            disabled={clientSideMessageError != null}
          />
          {signedIn === true ? (
            <label
              htmlFor="Verified"
              style={{ color: "green" }}
              className={styles.title}
            >
              Signed IN!!
            </label>
          ) : (
            <label htmlFor="Verified" style={{ color: "red" }}>
              {serverSideMessageError}
            </label>
          )}
        </form>
      }
    </>
  );
};
