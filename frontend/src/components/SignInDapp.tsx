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
import MessageEditor from "./MessageEditor"
import { SiwsMessage } from "siws_lib/dist"
import { Spinner } from '@chakra-ui/react'

export const SignInDapp: FC = () => {
  // const [shortText, setShortText] = useState("Please sign in")
  const [lastSig, setLastSig] = useState<string[]>([])
  const [lastMessage, setLastMessage] = useState<string>()
  const [clientSideMessageError, setClientSideMessageError] = useState<string>('')
  const [serverSideMessageError, setServerSideMessageError] = useState<string>('')


  const [logginIn, setLoggingIn] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const network = networkId()

  useEffect(() =>{
    console.log("useffect called")
    const createMessage = async () => {
      const loginString = 'Please Sign in' // cant be longer than 31  ascii characters
      let siwsMessageString = await createSiwsMessage(loginString)
      return siwsMessageString
    }
    createMessage().then((message) => {
      setLastMessage(message)
    }).catch((e) => console.error(e))
  },[])

  const handleSignSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      const result = await signMessage(lastMessage);
      setLastSig(result)
    } catch (e) {
      console.error(e)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      setSignedIn(false)
      setLoggingIn(true)
      setServerSideMessageError('')
      const verified = await verifySignInMessage(lastMessage, lastSig)
      setSignedIn(verified)
    } catch (e) {
      console.error(e)
      setSignedIn(false)
      setServerSideMessageError(e.message)
    }
    setLoggingIn(false)
  }

  return (
    <>
        <form>
          <h2 className={styles.title}>Edit your message</h2>
          {<MessageEditor
          data={lastMessage}
          onResult={(message: string) => {
            try{
              setLastMessage(message)
              let validatedMessage = (new SiwsMessage(message)).prepareMessage()
              setClientSideMessageError('')
            }
            catch (e){
              console.error(e)
              setClientSideMessageError(e.message + " \n You can try signing in with the message but since there were validation issues you might not be able to sign in.")
            }
          }}
        / >}
        {clientSideMessageError !== '' ?  (<label  style={{color: 'red'}} defaultValue={clientSideMessageError}>{clientSideMessageError}</label> ):""}
        </form>

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

      <form onSubmit={handleVerifySubmit}>

          <h2 className={styles.title}>
            Verify and Sign In { logginIn && <Spinner color='white.500' size='xl' width={30}/>}

          </h2>
          {/* Label and textarea for value r */}
          <label htmlFor="Verify and Sign In"></label>
          {/* Label and textarea for value s */}
          <input type="submit" value="Sign In" />
          {signedIn === true ? (<label htmlFor="Verified" style={{color: 'green'} } className={styles.title} >Signed IN!!</label> ): (<label htmlFor="Verified" style={{color: 'red'}}>{serverSideMessageError}</label> )}
        </form>
    </>
  )
}
