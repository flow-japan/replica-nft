import * as functions from 'firebase-functions';
import * as t from '@onflow/types';
import { opensea } from './services/opensea';
import { ethUtil } from './services/ethUtil';
import * as config from './config';
import { Util } from './services/util';

// USAGE:
//   Check Signature
//     $ curl 'https://us-central1-replica-nft-api.cloudfunctions.net/check?message={<contractAddress>-<tokenId>-<owner>-<flowOwner>-<expiresUnixtime>}&signature={signature}'
//       e.g. curl 'https://us-central1-replica-nft-api.cloudfunctions.net/check?message=0xd07dc4262bcdbf85190c01c996b4c06a461d2430-128695-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7-0x6f48f852926e137a-4102434800&signature=0x6dc7c031bd6c324a536d8f8160b5017030881bf74ce1ee50790e93fc9313cc5338fa3b3d24bf02ea9b073785397c75679af9b3b7bec37c9651ee3005bef7607d1b'
//   Mint
//     $ curl 'https://us-central1-replica-nft-api.cloudfunctions.net/mint?message={<contractAddress>-<tokenId>-<owner>-<flowOwner>-<expiresUnixtime>}&signature={signature}'
//       e.g. curl 'https://us-central1-replica-nft-api.cloudfunctions.net/mint?message=0xd07dc4262bcdbf85190c01c996b4c06a461d2430-128695-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7-0x6f48f852926e137a-4102434800&signature=0x6dc7c031bd6c324a536d8f8160b5017030881bf74ce1ee50790e93fc9313cc5338fa3b3d24bf02ea9b073785397c75679af9b3b7bec37c9651ee3005bef7607d1b'

const getParams = (req: any) => {
  const { message, signature } = req.query;
  const [ contractAddress, tokenId, owner, flowOwner, expiresAt ] = message.split('-');
  return { contractAddress, tokenId, owner, flowOwner, expiresAt, message, signature };
}

const validate = async (req: any) => {
  try {
    const { contractAddress, tokenId, owner, expiresAt, message, signature } = getParams(req);
    if (expiresAt < Math.floor(Date.now() / 1000)) throw new Error('Expired');
    await opensea.validateOwner(contractAddress, tokenId, owner);
    ethUtil.validateSignature(message, signature, owner);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
};

const validateAndMint = async (req: any) => {
  try {
    const validateResult = await validate(req);
    if (!validateResult.success) return validateResult;

    const { contractAddress, tokenId, owner, flowOwner, message, signature } = getParams(req);
    const util = new Util(config);
    const res = await util.sendTx('mint_nft.cdc', [
      [ flowOwner, t.Address ], // recipient
      [ contractAddress, t.String ], // contractAddress
      [ Number(tokenId), t.UInt64 ], // tokenId
      [ owner, t.String ], // ownerAtTime
      [ message, t.String ], // message
      [ signature, t.String ], // signature
    ]);
    console.log('mint succeeded!', res);
    return { success: true }
  } catch (e) {
    console.log(e)
    return { error: (e.message || 'Error Occured') };
  }
};

export const mint = functions.https.onRequest((req, res) => {
  validateAndMint(req).then((result: any) => {
    res.json(result);
  });
});

export const check = functions.https.onRequest((req, res) => {
  validate(req).then((result: any) => {
    res.json(result);
  });
});
