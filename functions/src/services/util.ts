import * as fs from 'fs';
import * as path from 'path';
import * as fcl from '@onflow/fcl';
import { FlowService } from './flow';

export class Util {
  private _flow: FlowService;
  private _account: any;

  constructor({ apiUrl, address, privateKey, keyIndex }: { apiUrl: string, address: string, privateKey: string, keyIndex: number }) {
    console.log({ apiUrl, address, privateKey, keyIndex });
    this._flow = new FlowService(apiUrl, address, privateKey, keyIndex);
    this._account = { address, privateKey, keyIndex };
  }

  get flow(): any {
    return this._flow;
  }

  get account(): any {
    return this._account;
  }

  async sendTx(transactionFileName: string, args: any[], account: any = this.account) {
    const authorization = this._flow.authorize(account);
    const transaction = fs
      .readFileSync(path.join(__dirname, `../../cadence/transactions/${transactionFileName}`), 'utf8')
      .replace(/0xNonFungibleToken/gi, `0x${this.account.address}`)
      .replace(/0xReplica/gi, `0x${this.account.address}`);
    return await this._flow.sendTx({
      transaction,
      args: args.map(arg => fcl.arg(arg[0], arg[1])),
      proposer: authorization,
      authorizations: [authorization],
      payer: authorization
    });
  };

  async executeScript(scriptFileName: string, args: any[] = []) {
    const script = fs
      .readFileSync(path.join(__dirname, `../../cadence/scripts/${scriptFileName}`), 'utf8')
      .replace(/0xNonFungibleToken/gi, `0x${this.account.address}`)
      .replace(/0xReplica/gi, `0x${this.account.address}`);
    return await this._flow.executeScript({
      script,
      args: args.map(arg => fcl.arg(arg[0], arg[1])),
    })
  }
}
