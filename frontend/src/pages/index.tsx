import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import { SignInDapp } from "../components/SignInDapp";
import { truncateAddress } from "../services/address.service";
import {
  connectWallet,
  connectWalletSilent,
} from "../services/wallet.service";

import styles from "../styles/Home.module.css";
import { Link } from "@chakra-ui/react";
import { StarknetWindowObject } from "get-starknet";
import { shortString } from "starknet";

const NetworkDisplay:React.FC<{
  connection: StarknetWindowObject, 
  setConnection: React.Dispatch<React.SetStateAction<StarknetWindowObject | null>>
}> = ({ connection, setConnection }) => {

  const [network, setNetwork] = useState<string | null>(null)
  useEffect(() => {
    try {
      connection?.provider?.getChainId().then(chainId => setNetwork(chainId));
    } catch(e) {
      console.error(e)
      setNetwork(null)
    }
  }, [connection])
  const networkName = useMemo(() => {
    try {
      return shortString.decodeShortString(network ?? "0x0")
    } catch(e) {
      return network
    }
  }, [network])

  return (
    <h3 style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span>ChainId: <code>{network}</code></span>
      <span>Connected Wallet: <code className={styles.flexRowCenter}><img src={connection.icon} className={styles.icon} alt="icon" /> {connection.name}</code></span>
      <span>Network Name: <code>{networkName}</code></span>
      <button onClick={() => setConnection(null)}>Disconnect</button>
    </h3>
  );
}

const Home: NextPage = () => {

  const [ walletConnection, setWalletConnection] = useState<StarknetWindowObject | null>(null)

  const isConnected = useMemo(() => {
    return walletConnection?.isConnected ?? false
  }, [walletConnection])

  const address = useMemo(() => {
    return walletConnection?.selectedAddress ?? "" 
  }, [walletConnection])

  useEffect(() => {
    (async () => {
      const connection = await connectWalletSilent();
      if(connection)
        setWalletConnection(connection);
    })();
  }, []);

  const handleConnectClick = async () => {
    const connection = await connectWallet();
    if(connection)
        setWalletConnection(connection);
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
                Github source
              </Link>
            </h3>
            <h3 style={{ margin: 0 }}>
              Wallet address: <code>{address && truncateAddress(address)}</code>
            </h3>
            <NetworkDisplay connection={walletConnection} setConnection={setWalletConnection} />
            <SignInDapp connection={walletConnection} />
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
