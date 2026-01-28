#!/bin/bash

source .env
NETWORK="anvil"

while [[ $# -gt 0 ]]; do
    case $1 in "--network")
        NETWORK="$2"
        shift
        shift
        ;;
    *)
        echo "unknown option: $1"
        exit 1
        ;;
    esac
done

case $NETWORK in
    "anvil")
        RPC_URL="$ANVIL_RPC_URL"
        ACCOUNT="$ANVIL_ACCOUNT"
        SENDER="$ANVIL_SENDER"
        ;;
    "base" | "base-sepolia")
        VERIFY_FLAG="--verify --verifier etherscan --etherscan-api-key $ETHERSCAN_API_KEY"
        if [ "$NETWORK" = "base" ]; then
            RPC_URL="$BASE_RPC_URL"
            ACCOUNT="$BASE_ACCOUNT"
            SENDER="$BASE_SENDER"
        else
            RPC_URL="$BASE_SEPOLIA_RPC_URL"
            ACCOUNT="$BASE_SEPOLIA_ACCOUNT"
            SENDER="$BASE_SEPOLIA_SENDER"
        fi
        ;;
    "base")
        ;;
    *)
        echo "Error: unsupported network '$NETWORK'"
        exit 1
        ;;
esac


if ! cast wallet list | grep -q "$ACCOUNT"; then
    echo "$ACCOUNT not created yet, creating..."
    cast wallet import $ACCOUNT --interactive
fi

forge script DeployZKT --rpc-url $RPC_URL --account $ACCOUNT --sender $SENDER --broadcast $VERIFY_FLAG
