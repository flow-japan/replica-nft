import Replica from 0xf8d6e0586b0a20c7

transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Replica.Collection>(from: Replica.CollectionStoragePath) == nil {
            let collection <- Replica.createEmptyCollection() as! @Replica.Collection
            acct.save(<- collection, to: Replica.CollectionStoragePath)
            acct.link<&{Replica.ReplicaCollectionPublic}>(Replica.CollectionPublicPath, target: Replica.CollectionStoragePath)
        }
    }
}
