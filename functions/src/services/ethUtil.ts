import * as ethereumjsUtil from 'ethereumjs-util';

class EthUtil {
  validateSignature(message: string, signature: string, signerAddress: string) {
    const messageHash = ethereumjsUtil.hashPersonalMessage(Buffer.from(message));
    const signatureParams = ethereumjsUtil.fromRpcSig(signature);
    const publicKey = ethereumjsUtil.ecrecover(messageHash, signatureParams.v, signatureParams.r, signatureParams.s);
    const recoverdAddress = ethereumjsUtil.bufferToHex(ethereumjsUtil.pubToAddress(publicKey));
    if (recoverdAddress.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error('Invalid signature');
    }
  }

  sign(message: string, privateKey: string): string {
    const messageHash = ethereumjsUtil.hashPersonalMessage(Buffer.from(message));
    const signature = ethereumjsUtil.ecsign(messageHash, ethereumjsUtil.toBuffer(privateKey));
    return ethereumjsUtil.toRpcSig(signature.v, signature.r, signature.s);
  }
}

export const ethUtil = new EthUtil();
