import Replica from 0x6f48f852926e137a

pub fun main(address: Address): Bool {
    return getAccount(address)
        .getCapability<&{Replica.ReplicaCollectionPublic}>(Replica.CollectionPublicPath)
        .check()
}
