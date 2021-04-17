import { ec as EC } from 'elliptic';
import { SHA3 } from 'sha3';
import * as fcl from '@onflow/fcl';
import * as types from '@onflow/types';
import * as rlp from '@onflow/rlp';

const ec: EC = new EC('p256');

export class FlowService {
  private address: string;
  private privateKey: string;
  private keyIndex: number;

  constructor(apiUrl: string, address: string, privateKey: string, keyIndex: number) {
    fcl.config().put('accessNode.api', apiUrl);
    this.address = address;
    this.privateKey = privateKey;
    this.keyIndex = keyIndex;
  }

  authorize({ address, privateKey, keyIndex }: { address: string, privateKey: string, keyIndex: number }) {
    return async (account: any = {}) => {
      const user = await this.getAccount(address);
      const key = user.keys[keyIndex];
      let sequenceNum;
      if (account.role.proposer) {
        sequenceNum = key.sequenceNumber;
      }
      const signingFunction = async (data: any) => {
        return {
          addr: user.address,
          keyId: key.index,
          signature: this.signWithKey(privateKey, data.message),
        };
      };
      return {
        ...account,
        addr: user.address,
        keyId: key.index,
        sequenceNum,
        signature: account.signature || null,
        signingFunction,
        resolve: null,
        roles: account.roles,
      };
    };
  };

  authorizeAccount = () => {
    return this.authorize({
      address: this.address, 
      privateKey: this.privateKey,
      keyIndex: this.keyIndex
    });
  }

  async getAccount(addr: string) {
    const { account } = await fcl.send([fcl.getAccount(addr)]);
    return account;
  };

  signWithKey(privateKey: string, msg: string) {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
    const sig = key.sign(this.hashMsg(msg));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, 'be', n);
    const s = sig.s.toArrayLike(Buffer, 'be', n);
    return Buffer.concat([r, s]).toString('hex');
  };

  hashMsg(msg: string) {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msg, 'hex'));
    return sha.digest();
  };

  genKeys() {
    const keys = ec.genKeyPair();
    const privateKey = keys.getPrivate('hex');
    const publicKey = keys.getPublic('hex').replace(/^04/, '');
    return {
      publicKey,
      privateKey,
      flowKey: this.encodePublicKey(publicKey)
    }
  }

  encodePublicKey(publicKey: string) {
    return rlp
      .encode([
        Buffer.from(publicKey, 'hex'),
        2,
        3,
        1000,
      ])
      .toString('hex');
  }

  async createFlowAccount() {
    const keys = this.genKeys();
    const authorization = this.authorizeAccount();
    const response = await fcl.send([
      fcl.transaction`
        transaction(publicKey: String) {
          let payer: AuthAccount
          prepare(payer: AuthAccount) {
            self.payer = payer
          }
          execute {
            let account = AuthAccount(payer: self.payer)
            account.addPublicKey(publicKey.decodeHex())
          }
        }
      `,
      fcl.args([ fcl.arg(keys.flowKey, types.String) ]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
    ]);
    const {events} = await fcl.tx(response).onceSealed();
    const accountCreatedEvent = events.find((d: any) => d.type === 'flow.AccountCreated');
    if (!accountCreatedEvent) throw new Error('No flow.AccountCreated found');
    let address = accountCreatedEvent.data.address;
    // a standardized string format for addresses is coming soon
    // our aim is to make them as small as possible while making them unambiguous
    address = address.replace(/^0x/, "");
    if (!address) throw new Error('An address is required');
  
    const account = await this.getAccount(address);
    const key = account.keys.find((d: any) => d.publicKey === keys.publicKey);
    if (!key) throw new Error('Could not find provided public key in on-chain flow account keys');
    
    return {
      address,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      keyIndex: key.index,
    };
  }

  async addContract({ name, code, proposer, authorizations, payer }: { name: string, code: string, proposer: any, authorizations: any, payer: any }) {
    const CODE = Buffer.from(code, 'utf8').toString('hex');
    const response = await fcl.send([
      fcl.transaction`
        transaction(name: String, code: String) {
          let signer: AuthAccount
          prepare(signer: AuthAccount) {
            self.signer = signer
          }
          execute {
            self.signer.contracts.add(name: name, code: code.decodeHex())
          }
        }
      `,
      fcl.args([ fcl.arg(name, types.String), fcl.arg(CODE, types.String) ]),
      fcl.proposer(proposer),
      fcl.authorizations(authorizations),
      fcl.payer(payer),
      fcl.limit(9999)
    ]);
    return await fcl.tx(response).onceExecuted();
  }

  async sendTx({ transaction, args, proposer, authorizations, payer }: { transaction: string, args: any[], proposer: any, authorizations: any, payer: any }) {
    const response = await fcl.send([
      fcl.transaction`
        ${transaction}
      `,
      fcl.args(args),
      fcl.proposer(proposer),
      fcl.authorizations(authorizations),
      fcl.payer(payer),
      fcl.limit(9999),
    ]);
    return await fcl.tx(response).onceSealed();
  };

  async executeScript({ script, args }: { script: string, args: any[] }) {
    const response = await fcl.send([ fcl.script`${script}`, fcl.args(args) ]);
    return await fcl.decode(response);
  }
}
