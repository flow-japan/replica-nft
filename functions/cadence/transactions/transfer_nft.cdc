import NonFungibleToken from 0xf8d6e0586b0a20c7
import Replica from 0xf8d6e0586b0a20c7

transaction(recipient: Address, withdrawID: UInt64) {
    prepare(acct: AuthAccount) {
        let collectionRef = acct.borrow<&Replica.Collection>(from: Replica.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the stored Replica collection")
        let transferToken <- collectionRef.withdraw(withdrawID: withdrawID)
        let receiverRef = getAccount(recipient).getCapability(Replica.CollectionPublicPath)!.borrow<&{Replica.ReplicaCollectionPublic}>()!
        receiverRef.deposit(token: <- transferToken)
    }
}
