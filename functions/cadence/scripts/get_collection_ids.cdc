import Replica from 0x6f48f852926e137a

pub fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    let collectionRef = acct.getCapability(Replica.CollectionPublicPath)
                            .borrow<&{Replica.ReplicaCollectionPublic}>()!
    return collectionRef.getIDs()
}
