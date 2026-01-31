#!/bin/bash

# ZK Sharia Coordinator - Deployment Script
# This script helps deploy the coordinator using Docker

set -e

echo "🐳 ZK Sharia Coordinator - Docker Deployment Script"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
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

    # Create circuits directory if it doesn't exist
    mkdir -p circuits data

    # Start with docker-compose
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi

    echo -e "${YELLOW}Waiting for service to start...${NC}"
    sleep 10

    if curl -s http://localhost:$PORT/health > /dev/null; then
        echo -e "${GREEN}✓ Local health check passed${NC}"
        echo ""
        echo -e "${BLUE}Service is running at: http://localhost:3000${NC}"
        echo -e "${BLUE}View logs with: docker-compose logs -f${NC}"
        echo -e "${BLUE}Stop with: docker-compose down${NC}"
    else
        echo -e "${RED}✗ Local health check failed${NC}"
        echo -e "${YELLOW}Check logs with: docker-compose logs${NC}"
    fi
}

# Stop local service
stop_local() {
    echo -e "${YELLOW}Stopping local service...${NC}"

    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi

    echo -e "${GREEN}✓ Service stopped${NC}"
}

# Production deployment guide
deploy_production() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Production Deployment Guide${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "To deploy to a production server:"
    echo ""
    echo "1. Copy files to your server:"
    echo "   scp -r sc/offchain-coordinator user@server:/opt/"
    echo ""
    echo "2. SSH into your server:"
    echo "   ssh user@server"
    echo ""
    echo "3. Navigate to the directory:"
    echo "   cd /opt/offchain-coordinator"
    echo ""
    echo "4. Configure environment:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    echo "5. Create circuits directory and add files:"
    echo "   mkdir -p circuits data"
    echo "   # Upload your circuit files to circuits/"
    echo ""
    echo "6. Start the service:"
    echo "   docker compose up -d"
    echo ""
    echo "7. Set up nginx reverse proxy (recommended):"
    echo "   - Install nginx: apt install nginx certbot python3-certbot-nginx"
    echo "   - Create config in /etc/nginx/sites-available/"
    echo "   - Get SSL certificate: certbot --nginx -d your-domain.com"
    echo ""
    echo "8. Optional: Create systemd service:"
    echo "   - Create /etc/systemd/system/sharia-coordinator.service"
    echo "   - See DEPLOYMENT.md for full configuration"
    echo ""
    echo "For full details, see: DEPLOYMENT.md"
    echo ""
}

# View logs
view_logs() {
    echo -e "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"

    if docker compose version &> /dev/null; then
        docker compose logs -f
    else
        docker-compose logs -f
    fi
}

# Show status
show_status() {
    echo -e "${YELLOW}Checking service status...${NC}"
    echo ""

    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi

    echo ""
    if curl -s http://localhost:$PORT/health > /dev/null; then
        echo -e "${GREEN}✓ Service is healthy${NC}"
        curl -s http://localhost:$PORT/health | jq . 2>/dev/null || curl -s http://localhost:$PORT/health
    else
        echo -e "${RED}✗ Service is not responding${NC}"
    fi
}

# Setup environment file
setup_env() {
    echo -e "${YELLOW}Setting up environment file...${NC}"

    if [ -f ".env" ]; then
        echo -e "${YELLOW}.env file already exists. Backup created as .env.backup${NC}"
        cp .env .env.backup
    fi

    cp .env.example .env

    echo -e "${GREEN}✓ .env file created from .env.example${NC}"
    echo -e "${YELLOW}Please edit .env with your values:${NC}"
    echo "  nano .env"
    echo ""
    echo "Required variables:"
    echo "  - RPC_URL: Your Alchemy/Base RPC endpoint"
    echo "  - PRIVATE_KEY: Wallet private key for proof submission"
    echo "  - DAO_CONTRACT_ADDRESS: Deployed ZKTCore address"
    echo ""
}

# Setup circuits directory
setup_circuits() {
    echo -e "${YELLOW}Setting up circuits directory...${NC}"

    mkdir -p circuits data

    echo -e "${GREEN}✓ Directories created${NC}"
    echo ""
    echo "Please copy your circuit files to the circuits/ directory:"
    echo "  - ShariaVoteAggregator.wasm"
    echo "  - sharia_0000.zkey"
    echo "  - verification_key.json"
    echo ""
    echo "Example:"
    echo "  cp ../../circuits/build/ShariaVoteAggregator_js/ShariaVoteAggregator.wasm circuits/"
    echo "  cp ../../circuits/build/sharia_0000.zkey circuits/"
    echo "  cp ../../circuits/build/verification_key.json circuits/"
    echo ""
}

# Main menu
main() {
    check_prerequisites

    PS3='Please select an option: '
    options=(
        "Setup Environment (.env)"
        "Setup Circuits Directory"
        "Build Docker Image"
        "Start Local Service"
        "Stop Local Service"
        "View Logs"
        "Show Status"
        "Production Deployment Guide"
        "Full Setup (Env + Circuits + Build + Start)"
        "Quit"
    )

    select opt in "${options[@]}"
    do
        case $opt in
            "Setup Environment (.env)")
                setup_env
                break
                ;;
            "Setup Circuits Directory")
                setup_circuits
                break
                ;;
            "Build Docker Image")
                build_docker
                break
                ;;
            "Start Local Service")
                test_local
                break
                ;;
            "Stop Local Service")
                stop_local
                break
                ;;
            "View Logs")
                view_logs
                break
                ;;
            "Show Status")
                show_status
                break
                ;;
            "Production Deployment Guide")
                deploy_production
                break
                ;;
            "Full Setup (Env + Circuits + Build + Start)")
                setup_env
                setup_circuits
                build_docker
                test_local
                break
                ;;
            "Quit")
                break
                ;;
            *) echo "Invalid option";;
        esac
    done
}

# Check if running with an argument
if [ $# -gt 0 ]; then
    case $1 in
        "build")
            check_prerequisites
            build_docker
            ;;
        "start")
            check_prerequisites
            test_local
            ;;
        "stop")
            stop_local
            ;;
        "logs")
            view_logs
            ;;
        "status")
            show_status
            ;;
        "production")
            deploy_production
            ;;
        *)
            echo "Usage: $0 [build|start|stop|logs|status|production]"
            exit 1
            ;;
    esac
else
    main
fi
