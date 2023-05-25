import * as starknet from 'starknet';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import Session from 'express-session';
import { randomStringForEntropy } from '@stablelib/random';
import { ErrorTypes,  Signature, SignInWithStarknetError, SignInWithStarknetResponse, VerifyParams } from 'siws_lib/dist/';
import { SiwsMessage } from 'siws_lib/dist';


const app = express();
const provider =  new starknet.Provider({
    sequencer: {
      network:  starknet.constants.NetworkName.SN_GOERLI
    }
  })
  
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000','https://localhost:3000', 'http://localhost:3001', 'https://localhost:3001', 'http://143.42.2.9:3000','https://143.42.2.9:3000'],
    credentials: true,
}))

app.use(Session({
    name: 'siws-quickstart',
    secret: "siws-quickstart-secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true }
}));

const generateNonce = () => {
    const nonce = randomStringForEntropy(96);
    if (!nonce || nonce.length < 8) {
        throw new Error('Error during nonce creation.');
    }
    return nonce;
};

app.get('/nonce', function (req, res) {
    // res.setHeader('Content-Type', 'text/plain');
    // res.send(generateNonce());
  
    (req['session'] as any).nonce = generateNonce();
    console.log((req['session'] as any).nonce);
    res.setHeader('Content-Type', 'text/plain');
    res['status'](200).send((req['session'] as any).nonce);

});

app.post('/verify', async function (req: Request, res: Response) {
    try {
        console.log(req); 
        if (!req['body'].message) {
            res['status'](422).json({ message: 'Expected prepareMessage object as body.' });
            return;
        }
        console.log( req['body'].message);
        const message = new SiwsMessage(
            req['body'].message,    
        );

        console.log( 'signature', req['body'].signature);
        
        const isVerified = await message.verify({ signature: req['body'].signature, nonce: (req['session'] as any).nonce }, {provider:provider});
      
        if (isVerified.success) {
            console.log("Verified!");
        } else {
            console.log("Not Verified!");
        }
        
        (req['session'] as any).siws = message;
        // req['session'].cookie.expires = new Date(message.expirationTime);
        req['session'].save(() => res['status'](200).send(true));
    } catch (e) {
        (req['session'] as any).siws = null;
        (req['session'] as any).nonce = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req['session'].save(() => res['status'](440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req['session'].save(() => res['status'](422).json({ message: e.message }));
                break;
            }
            default: {
                req['session'].save(() => res['status'](500).json({ message: e.message }));
                break;
            }
        }
    }
});

app.get('/personal_information', function (req, res) {
    if (!(req['session'] as any).siws) {
        res['status'](401).json({ message: 'You have to first sign_in' });
        return;
    }
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain');
    res.send(`You are authenticated and your address is: ${(req['session'] as any).siws.address}`);
});
const PORT = 3001;
console.log("Listening on port", PORT);
app.listen(3001);

