import NonFungibleToken from 0xf8d6e0586b0a20c7

pub contract Replica: NonFungibleToken {
    pub event ContractInitialized()

    pub event Mint(id: UInt64, contractAddress: String, tokenId: UInt64, ownerAtTime: String)
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Burn(id: UInt64)

    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    pub var totalSupply: UInt64
    pub var existingReplicaIds: {String: UInt64}

    // Experimental: Is the storage capacity OK?
    access(self) var signatures: {UInt64: {String : String}}

    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        pub let contractAddress: String
        pub let tokenId: UInt64
        pub let ownerAtTime: String
        pub let message: String
        pub let signature: String
        pub let rarity: UInt8
        pub let hp: UInt32
        pub let def: UInt32
        pub let atk: UInt32

        init(contractAddress: String, tokenId: UInt64, ownerAtTime: String, message: String, signature: String) {
            pre {
                !Replica.existsReplica(key: contractAddress.concat("-").concat(tokenId.toString())): 
                    "Cannot mint: already minted the replica"
            }
            self.id = Replica.totalSupply
            self.contractAddress = contractAddress
            self.tokenId = tokenId
            self.ownerAtTime = ownerAtTime
            self.message = message
            self.signature = signature

            // Set parameters by pseudo-random number
            let block = getCurrentBlock()
            let rarityBase: Int = Int(block.id[1]) % 100 * 10
            self.rarity = UInt8(rarityBase > 999 ? 5 : rarityBase > 990 ? 4 : rarityBase > 850 ? 3 : rarityBase > 500 ? 2 : 1)
            self.hp = UInt32(Int(Int(block.id[2]) % 100 + 1) * Int(Int(block.id[3]) % 100  + 1))
            self.def = UInt32(Int(Int(block.id[4]) % 100 + 1) * Int(Int(block.id[5]) % 100 + 1))
            self.atk = UInt32(Int(Int(block.id[6]) % 100 + 1) * Int(Int(block.id[7]) % 100 + 1))

            Replica.signatures[self.id] = {
                "signer": self.ownerAtTime,
                "message": self.message,
                "signature": self.signature
            }
            Replica.existingReplicaIds[contractAddress.concat("-").concat(tokenId.toString())] = self.id
            Replica.totalSupply = Replica.totalSupply + 1 as UInt64
            emit Mint(id: self.id, contractAddress: self.contractAddress, tokenId: self.tokenId, ownerAtTime: self.ownerAtTime)
        }

        destroy() {
            emit Burn(id: self.id)
        }
    }

    pub resource Minter {
        pub fun mint(contractAddress: String, tokenId: UInt64, ownerAtTime: String, message: String, signature: String): @NFT {
            return <- create NFT(contractAddress: contractAddress, tokenId: tokenId, ownerAtTime: ownerAtTime, message: message, signature: signature)
        }
    }

    pub resource interface ReplicaCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun batchDeposit(tokens: @NonFungibleToken.Collection)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowReplica(id: UInt64): &Replica.NFT
    }

    pub resource Collection: ReplicaCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic { 
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init() {
            self.ownedNFTs <- {}
        }

        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("Cannot withdraw: Hero does not exist in the collection")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        pub fun batchWithdraw(ids: [UInt64]): @NonFungibleToken.Collection {
            var batchCollection <- create Collection()
            for id in ids {
                batchCollection.deposit(token: <-self.withdraw(withdrawID: id))
            }
            return <-batchCollection
        }

        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Replica.NFT
            let id = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            if self.owner?.address != nil {
                emit Deposit(id: id, to: self.owner?.address)
            }
            destroy oldToken
        }

        pub fun batchDeposit(tokens: @NonFungibleToken.Collection) {
            let keys = tokens.getIDs()
            for key in keys {
                self.deposit(token: <-tokens.withdraw(withdrawID: key))
            }
            destroy tokens
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        pub fun borrowReplica(id: UInt64): &Replica.NFT {
            let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return ref as! &Replica.NFT
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Replica.Collection()
    }

    // key: <contractAddress>-<tokenId>
    pub fun existsReplica(key: String): Bool {
        if Replica.existingReplicaIds[key] == nil {
            return false
        }
        return Replica.existingReplicaIds[key]! > 0 as UInt64
    }

    // key: <contractAddress>-<tokenId>
    pub fun getSignature(key: String): {String: String} {
        if Replica.existingReplicaIds[key] == nil {
            return {}
        }
        return self.signatures[Replica.existingReplicaIds[key]!]!
    }

    init() {
        // TODO: 最終的に変更
        self.CollectionStoragePath = /storage/ReplicaCollection000
        self.CollectionPublicPath = /public/ReplicaCollection000
        self.MinterStoragePath = /storage/ReplicaMinter000

        self.totalSupply = 1
        self.existingReplicaIds = {}
        self.signatures = {}

        self.account.save<@Collection>(<- create Collection(), to: self.CollectionStoragePath)
        self.account.link<&{ReplicaCollectionPublic}>(self.CollectionPublicPath, target: self.CollectionStoragePath)
        self.account.save<@Minter>(<- create Minter(), to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}
