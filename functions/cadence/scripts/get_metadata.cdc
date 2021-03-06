import Replica from 0xf8d6e0586b0a20c7

pub fun main(account: Address, ids: [UInt64]): [{String: String}] {
    let acct = getAccount(account)
    let collectionRef = acct.getCapability(Replica.CollectionPublicPath)
                            .borrow<&{Replica.ReplicaCollectionPublic}>()!
    var metadataArray: [{String: String}] = []
    for id_ in ids {
        let nftRef = collectionRef.borrowReplica(id: id_)
        metadataArray.append({
            "id": nftRef.id.toString(),
            "contractAddress": nftRef.contractAddress,
            "tokenId": nftRef.tokenId.toString(),
            "ownerAtTime": nftRef.ownerAtTime,
            "message": nftRef.message,
            "signature": nftRef.signature,
            "rarity": nftRef.rarity.toString(),
            "hp": nftRef.hp.toString(),
            "def": nftRef.def.toString(),
            "atk": nftRef.atk.toString()
        })
    }
    return metadataArray
}
