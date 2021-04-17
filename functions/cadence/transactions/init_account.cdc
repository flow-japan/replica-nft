import Replica from 0x6f48f852926e137a

transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Replica.Collection>(from: Replica.CollectionStoragePath) == nil {
            let collection <- Replica.createEmptyCollection() as! @Replica.Collection
            acct.save(<- collection, to: Replica.CollectionStoragePath)
            acct.link<&{Replica.ReplicaCollectionPublic}>(Replica.CollectionPublicPath, target: Replica.CollectionStoragePath)
        }
    }
}
