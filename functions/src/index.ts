import * as functions from 'firebase-functions';
import * as t from '@onflow/types';
import { opensea } from './services/opensea';
import { ethUtil } from './services/ethUtil';
import * as config from './config';
import { Util } from './services/util';

// USAGE:
//   Check Signature
//     $ curl 'http://localhost:5000/replica-nft-api/us-central1/check?message={<contractAddress>-<tokenId>-<owner>-<flowOwner>-<expiresUnixtime>}&signature={signature}'
//       e.g. curl 'http://localhost:5000/replica-nft-api/us-central1/check?message=0xd07dc4262bcdbf85190c01c996b4c06a461d2430-128695-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7-0xf8d6e0586b0a20c7-4102434800&signature=0x171f50b4ae206867be24fce0128504205f0122f129cdf3e9107a51004aeec94f5184477effce4d3fed7b6e377f781dce4dfe4323f4b4f65a89f356321f8c8bbd1b'
//   Mint
//     $ curl 'http://localhost:5000/replica-nft-api/us-central1/mint?message={<contractAddress>-<tokenId>-<owner>-<flowOwner>-<expiresUnixtime>}&signature={signature}'
//       e.g. curl 'http://localhost:5000/replica-nft-api/us-central1/mint?message=0xd07dc4262bcdbf85190c01c996b4c06a461d2430-128695-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7-0xf8d6e0586b0a20c7-4102434800&signature=0x171f50b4ae206867be24fce0128504205f0122f129cdf3e9107a51004aeec94f5184477effce4d3fed7b6e377f781dce4dfe4323f4b4f65a89f356321f8c8bbd1b'

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
