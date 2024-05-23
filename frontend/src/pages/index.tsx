import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { SignInDapp } from "../components/SignInDapp";
import { truncateAddress } from "../services/address.service";
import {
  addWalletChangeListener,
  connectWallet,
  isPreauthorized,
  isWalletConnected,
  networkUrl,
  walletAddress,
} from "../services/wallet.service";
import styles from "../styles/Home.module.css";
import { Link } from "@chakra-ui/react";

function NetworkDisplay() {
  const [network, setNetwork] = useState<string>("");

  useEffect(() => {
    networkUrl().then(setNetwork);
  }, []);

  return (
    <h3 style={{ margin: 0 }}>
      Network: <code>{network}</code>
    </h3>
  );
}

const Home: NextPage = () => {
  const [isConnected, setIsConnected] = useState(isWalletConnected());
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    addWalletChangeListener((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress("");
        setIsConnected(false);
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (await isPreauthorized()) {
        await handleConnectClick();
      }
    })();
  }, []);

  const handleConnectClick = async () => {
    await connectWallet();
    setIsConnected(isWalletConnected());
    setAddress(await walletAddress());
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign-in-with-Starknet Test App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {isConnected ? (
          <>
            <h3 style={{ margin: 0 }}>
              <Link
                href="https://github.com/NethermindEth/sign-in-with-starknet"
                isExternal
              >
                Github source{" "}
              </Link>
            </h3>
            <h3 style={{ margin: 0 }}>
              Wallet address: <code>{address && truncateAddress(address)}</code>
            </h3>
            <NetworkDisplay />
            <SignInDapp />
          </>
        ) : (
          <>
            <button className={styles.connect} onClick={handleConnectClick}>
              Connect Wallet
            </button>
            <p>First connect wallet to use dapp.</p>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
