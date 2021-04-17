#!/bin/bash
flow project start-emulator &

sleep 2

flow project deploy

flow transactions send --code=./functions/cadence/transactions/init_account.cdc

flow scripts execute --code=./functions/cadence/scripts/check_account.cdc --args="[{\"type\": \"Address\", \"value\": \"0xf8d6e0586b0a20c7\"}]"

flow scripts execute --code=./functions/cadence/scripts/get_collection_ids.cdc --args="[{\"type\": \"Address\", \"value\": \"0xf8d6e0586b0a20c7\"}]"

flow transactions send --code=./functions/cadence/transactions/mint_nft.cdc --args="[ \
  {\"type\": \"Address\", \"value\": \"0xf8d6e0586b0a20c7\"}, \
  {\"type\": \"String\", \"value\": \"0x12345\"}, \
  {\"type\": \"UInt64\", \"value\": \"1\"}, \
  {\"type\": \"String\", \"value\": \"0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7\"}, \
  {\"type\": \"String\", \"value\": \"test message\"}, \
  {\"type\": \"String\", \"value\": \"test signature\"} \
]"

flow scripts execute --code=./functions/cadence/scripts/get_collection_ids.cdc --args="[{\"type\": \"Address\", \"value\": \"0xf8d6e0586b0a20c7\"}]"

flow scripts execute --code=./functions/cadence/scripts/exists_replica.cdc --args="[{\"type\": \"String\", \"value\": \"0x12345-1-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7\"}]"

flow scripts execute --code=./functions/cadence/scripts/get_signature.cdc --args="[{\"type\": \"String\", \"value\": \"0x12345-1-0x98d562c7A4781e3e6c0d16F67469b0A3b0CB25C7\"}]"

flow scripts execute --code=./functions/cadence/scripts/get_metadata.cdc --args="[ \
  {\"type\": \"Address\", \"value\": \"0xf8d6e0586b0a20c7\"}, \
  {\"type\": \"Array\", \"value\": [ \
    {\"type\": \"UInt64\", \"value\": \"1\"} \
  ]} \
]"

pkill -KILL -f "flow project start-emulator"
