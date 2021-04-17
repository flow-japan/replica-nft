import Replica from 0x6f48f852926e137a

pub fun main(key: String): {String: String} {
    return Replica.getSignature(key: key)
}
