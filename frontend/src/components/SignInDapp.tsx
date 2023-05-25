import { FC, useEffect, useState } from "react"

import { truncateAddress } from "../services/address.service"
import {
  getExplorerBaseUrl,
  networkId,
  signMessage,
  createSiwsMessage,
  waitForTransaction,
  verifySignInMessage,
} from "../services/wallet.service"
import styles from "../styles/Home.module.css"

export const SignInDapp: FC = () => {
  const [shortText, setShortText] = useState("Please sign in")
  const [lastSig, setLastSig] = useState<string[]>([])
  const [lastMessage, setLastMessage] = useState<string>()

  const [signedIn, setSignedIn] = useState(false)

  const network = networkId()

  const handleSignSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      // setTransactionStatus("approve")  
      console.log("sign", shortText)
      let siwsMessageString = await createSiwsMessage(shortText);
      const result = await signMessage(siwsMessageString);

      setLastSig(result)
      setLastMessage(siwsMessageString)
    } catch (e) {
      console.error(e)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      const verified = await verifySignInMessage(lastMessage, lastSig)
      setSignedIn(verified)
    } catch (e) {
      console.error(e)
      setSignedIn(false)
    }
  }


  return (
    <>
      <div className="columns">
        <form onSubmit={handleSignSubmit}>
          <h2 className={styles.title}>Sign</h2>

          <label htmlFor="Short-Text">Short Text(limited to 31 ascii characters)</label>
          <input
            type="text"
            id="short-text"
            name="short-text"
            value={shortText}
            onChange={(e) => setShortText(e.target.value)}
            placeholder={shortText}
          />

          <input type="submit" value="Sign" />
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
            readOnly
          />
          {/* Label and textarea for value s */}
          <label htmlFor="s">s</label>
          <textarea
            className={styles.textarea}
            id="s"
            name="s"
            value={lastSig[1]}
            readOnly
          />
        </form>

      </div>
      <form onSubmit={handleVerifySubmit}>
          <h2 className={styles.title}>Verify and Sign In</h2>

          {/* Label and textarea for value r */}
          <label htmlFor="Verify and Sign In">Verify and Sign In</label>
          {/* Label and textarea for value s */}
          <input type="submit" value="Sign In" />
          {signedIn === true ? (<label htmlFor="Verified" style={{color: 'green'}}>Signed IN!!</label> ): (<label htmlFor="Verified" style={{color: 'red'}}>Not Signed IN!!</label> )}
        </form>
    </>
  )
}
