import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import Session from 'express-session';
import { randomStringForEntropy } from '@stablelib/random';
import { SiwsMessage, ErrorTypes, Header, Payload, Signature, SignInWithStarknetError, SignInWithStarknetResponse, VerifyParams } from 'siws_lib/lib';

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8080',
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

    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);

});

app.post('/verify', async function (req: Request, res: Response) {
    try {
        if (!req.body.message) {
            res.status(422).json({ message: 'Expected prepareMessage object as body.' });
            return;
        }
        const { header, payload, signature } = JSON.parse(req.body);
        const message = new SiwsMessage({
          header,
          payload,
        });
        const isVerified = await message.verify({ signature: req.body.signature, nonce: req.session.nonce });
      
        if (isVerified.success) {
            console.log("Verified!");
          } else {
            console.log("Not Verified!");
        }
        
        req.session.siwe = message;
        req.session.cookie.expires = new Date(message.expirationTime);
        req.session.save(() => res.status(200).send(true));
    } catch (e) {
        req.session.siwe = null;
        req.session.nonce = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req.session.save(() => res.status(440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req.session.save(() => res.status(422).json({ message: e.message }));
                break;
            }
            default: {
                req.session.save(() => res.status(500).json({ message: e.message }));
                break;
            }
        }
    }
});

app.get('/personal_information', function (req, res) {
    if (!req.session.siws) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain');
    res.send(`You are authenticated and your address is: ${req.session.siws.address}`);
});

app.listen(3000);

