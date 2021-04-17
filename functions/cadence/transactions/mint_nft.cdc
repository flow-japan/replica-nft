import NonFungibleToken from 0xf8d6e0586b0a20c7
import Replica from 0xf8d6e0586b0a20c7

transaction(recipient: Address, contractAddress: String, tokenId: UInt64, ownerAtTime: String, message: String, signature: String) {
    let minter: &Replica.Minter

    prepare(acct: AuthAccount) {
        if acct.borrow<&Replica.Collection>(from: Replica.CollectionStoragePath) == nil {
            let collection <- Replica.createEmptyCollection()
            acct.save(<-collection, to: Replica.CollectionStoragePath)
            // acct.link<&Replica.Collection{NonFungibleToken.CollectionPublic, Replica.CollectionPublicPath}>(
            //   Replica.CollectionPublicPath,
            //   target: Replica.CollectionStoragePath
            // )
            acct.link<&{Replica.ReplicaCollectionPublic}>(Replica.CollectionPublicPath, target: Replica.CollectionStoragePath)
        }

        self.minter = acct.borrow<&Replica.Minter>(from: Replica.MinterStoragePath)
            ?? panic("Could not borrow a reference to the minter")
    }

    execute {
        let replica <- self.minter.mint(contractAddress: contractAddress, tokenId: tokenId, ownerAtTime: ownerAtTime, message: message, signature: signature)
        log("mint success")
        log(replica.id)
        let receiverRef = getAccount(recipient).getCapability(Replica.CollectionPublicPath).borrow<&{Replica.ReplicaCollectionPublic}>()
            ?? panic("Cannot borrow a reference to the recipient's Replica collection")
        receiverRef.deposit(token: <- replica)
        log("mint success")
    }
}
