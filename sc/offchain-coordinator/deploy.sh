#!/bin/bash

# ZK Sharia Coordinator - Deployment Script
# This script helps deploy the coordinator to Phala Cloud

set -e

echo "🕌 ZK Sharia Coordinator - Deployment Script"
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm is not installed. Please install Node.js first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Build Docker image
build_docker() {
    echo -e "${YELLOW}Building Docker image...${NC}"

    if [ ! -f "Dockerfile" ]; then
        echo -e "${RED}Dockerfile not found. Please run from the coordinator directory.${NC}"
        exit 1
    fi

    docker build -t sharia-zk-coordinator .
    echo -e "${GREEN}✓ Docker image built${NC}"
}

# Test locally
test_local() {
    echo -e "${YELLOW}Testing locally...${NC}"

    if [ ! -f ".env" ]; then
        echo -e "${RED}.env file not found. Copy .env.example and configure it.${NC}"
        exit 1
    fi

    docker run --rm -p 3000:3000 \
        --env-file .env \
        sharia-zk-coordinator &
    DOCKER_PID=$!

    sleep 5

    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✓ Local health check passed${NC}"
        kill $DOCKER_PID 2>/dev/null || true
    else
        echo -e "${RED}✗ Local health check failed${NC}"
        kill $DOCKER_PID 2>/dev/null || true
        exit 1
    fi
}

# Deploy to Phala
deploy_phala() {
    echo -e "${YELLOW}Deploying to Phala Cloud...${NC}"

    if ! command -v phala &> /dev/null; then
        echo -e "${YELLOW}Phala CLI not found. Installing...${NC}"
        npm install -g @phala/cloud
    fi

    echo -e "${YELLOW}Please login to Phala:${NC}"
    phala login

    if [ ! -f ".env.production" ]; then
        echo -e "${RED}.env.production not found. Please create it first.${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Deploying...${NC}"
    phala deploy \
        --name sharia-zk-coordinator \
        --docker sharia-zk-coordinator \
        --env .env.production \
        --tee \
        --region us-east

    echo -e "${GREEN}✓ Deployed to Phala Cloud${NC}"
}

# Main menu
main() {
    check_prerequisites

    PS3='Please select an option: '
    options=("Build Docker Image" "Test Locally" "Deploy to Phala" "All" "Quit")

    select opt in "${options[@]}"
    do
        case $opt in
            "Build Docker Image")
                build_docker
                break
                ;;
            "Test Locally")
                test_local
                break
                ;;
            "Deploy to Phala")
                deploy_phala
                break
                ;;
            "All")
                build_docker
                test_local
                deploy_phala
                break
                ;;
            "Quit")
                break
                ;;
            *) echo "Invalid option";;
        esac
    done
}

main
