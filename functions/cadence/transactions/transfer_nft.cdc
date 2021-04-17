import NonFungibleToken from 0x631e88ae7f1d7c20
import Replica from 0x6f48f852926e137a

transaction(recipient: Address, withdrawID: UInt64) {
    prepare(acct: AuthAccount) {
        let collectionRef = acct.borrow<&Replica.Collection>(from: Replica.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the stored Replica collection")
        let transferToken <- collectionRef.withdraw(withdrawID: withdrawID)
        let receiverRef = getAccount(recipient).getCapability(Replica.CollectionPublicPath)!.borrow<&{Replica.ReplicaCollectionPublic}>()!
        receiverRef.deposit(token: <- transferToken)
    }
}
