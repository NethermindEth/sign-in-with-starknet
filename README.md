## sign-in-with-starknet

Built in the same spirit as [eip-4361](https://eips.ethereum.org/EIPS/eip-4361) 
but utilizing typed data similar to [EIP-712](https://www.starknetjs.com/docs/guides/signature/#sign-and-verify-following-eip712)
Sign-In with Starknet describes how starknet accounts authenticate with 
off-chain services by signing a standard message format parameterized by scope
and security mechanisms (e.g., a nonce). 


#Build the lib first
```shell
cd siws_lib
npm install
npm run build
```

#Deploy the backend second

```shell
cd backend
npm install
npm run start
```

#Deploy the frontend last

```shell
cd frontend
npm install
npm run build
npm run start
```

#Deployment
Continous Deployment at (http://143.42.2.9:3000/)




