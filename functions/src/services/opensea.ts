import axios from 'axios';

class OpenSea {
  async validateOwner(contractAddress: string, tokenId: string, owner: string) {
    const url = `https://api.opensea.io/api/v1/assets?owner=${owner}&token_ids=${tokenId}&asset_contract_address=${contractAddress}&order_direction=desc&offset=0&limit=20`;
    console.log('query:', url);
    const { data } = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': 'f1618b1465684514a48b9721369133ee'
      },
      data: {}
    });
    // console.log(data);
    if (!data || !data.assets || data.assets.length === 0) {
      throw new Error('Invalid owner');
    }
  }
}

export const opensea = new OpenSea();