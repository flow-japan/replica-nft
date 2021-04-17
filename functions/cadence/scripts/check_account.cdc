import Replica from 0xf8d6e0586b0a20c7

pub fun main(address: Address): Bool {
    return getAccount(address)
        .getCapability<&{Replica.ReplicaCollectionPublic}>(Replica.CollectionPublicPath)
        .check()
}
