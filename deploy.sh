#!/bin/bash

# SurvivalIndex Backend Deployment Script
# Usage: ./deploy.sh [DROPLET_IP]

set -e

DROPLET_IP=$1

if [ -z "$DROPLET_IP" ]; then
    echo "Usage: ./deploy.sh DROPLET_IP"
    echo "Example: ./deploy.sh 164.90.123.456"
    exit 1
fi

echo "🚀 Deploying SurvivalIndex Backend to $DROPLET_IP"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
ssh -o ConnectTimeout=5 root@$DROPLET_IP "echo 'SSH connection successful'" || {
    echo "❌ Cannot connect to droplet. Check IP address and SSH keys."
    exit 1
}

echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing Docker and dependencies...${NC}"
ssh root@$DROPLET_IP << 'ENDSSH'
    # Update system
    apt update && apt upgrade -y
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        apt install docker-compose -y
    fi
    
    # Install git
    apt install git -y
    
    echo "✓ Docker and dependencies installed"
ENDSSH

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Cloning repository...${NC}"
ssh root@$DROPLET_IP << 'ENDSSH'
    cd /opt
    
    # Remove old installation if exists
    if [ -d "survivalindex" ]; then
        echo "Removing old installation..."
        rm -rf survivalindex
    fi
    
    # Clone repository
    git clone https://github.com/selwyntheo/survivalindex.git
    cd survivalindex/apps/backend
    
    # Create data directory
    mkdir -p data
    
    echo "✓ Repository cloned"
ENDSSH

echo -e "${GREEN}✓ Repository cloned${NC}"
echo ""

echo -e "${YELLOW}Step 4: Configuring environment...${NC}"
echo "Please enter your configuration:"
read -p "Frontend URL (e.g., https://your-app.ondigitalocean.app): " FRONTEND_URL
read -sp "Anthropic API Key: " ANTHROPIC_API_KEY
echo ""

ssh root@$DROPLET_IP << ENDSSH
    cd /opt/survivalindex/apps/backend
    
    # Create .env file
    cat > .env << 'EOF'
NODE_ENV=production
PORT=8080
DATABASE_URL=file:/app/data/prod.db
FRONTEND_URL=$FRONTEND_URL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF
    
    chmod 600 .env
    echo "✓ Environment configured"
ENDSSH

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

echo -e "${YELLOW}Step 5: Building and starting Docker containers...${NC}"
ssh root@$DROPLET_IP << 'ENDSSH'
    cd /opt/survivalindex/apps/backend
    
    # Build and start containers
    docker-compose up -d --build
    
    echo "✓ Containers started"
ENDSSH

echo -e "${GREEN}✓ Docker containers running${NC}"
echo ""

echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"
ssh root@$DROPLET_IP << 'ENDSSH'
    # Install UFW if not present
    apt install ufw -y
    
    # Configure firewall
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp
    
    echo "✓ Firewall configured"
ENDSSH

echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}Step 7: Waiting for services to start...${NC}"
sleep 10

echo -e "${YELLOW}Step 8: Testing deployment...${NC}"
ssh root@$DROPLET_IP << 'ENDSSH'
    # Wait for service to be ready
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/health > /dev/null; then
            echo "✓ Backend is healthy"
            break
        fi
        echo "Waiting for backend to start... ($i/30)"
        sleep 2
    done
    
    # Show logs
    echo ""
    echo "Recent logs:"
    docker-compose -f /opt/survivalindex/apps/backend/docker-compose.yml logs --tail=20 backend
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your API is now running at:"
echo "  • http://$DROPLET_IP:8080/api"
echo "  • http://$DROPLET_IP:8080/api/health"
echo ""
echo "Next steps:"
echo "  1. Test the API: curl http://$DROPLET_IP:8080/api/health"
echo "  2. Seed the database: ssh root@$DROPLET_IP 'docker exec survivalindex-backend-backend-1 npm run seed'"
echo "  3. Configure your domain (optional)"
echo "  4. Set up SSL with Certbot (optional)"
echo "  5. Update frontend VITE_API_URL to: http://$DROPLET_IP:8080"
echo ""
echo "View logs: ssh root@$DROPLET_IP 'docker-compose -f /opt/survivalindex/apps/backend/docker-compose.yml logs -f backend'"
echo ""
