#!/bin/bash

# EduPrep Deployment Script for Vercel + Railway
# This script helps deploy the application to Vercel (frontend) and Railway (backend)

set -e

echo "======================================"
echo "EduPrep Deployment Script"
echo "======================================"

# Check if required tools are installed
check_tools() {
    echo "Checking required tools..."
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git not found. Please install Git."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    echo "✅ Git and npm found"
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo ""
    echo "📦 Deploying Frontend to Vercel..."
    echo "======================================"
    
    if ! command -v vercel &> /dev/null; then
        echo "⚠️  Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    cd frontend
    
    echo "Building frontend..."
    npm run build
    
    echo "Deploying to Vercel..."
    vercel deploy --prod --yes
    
    echo "✅ Frontend deployed!"
    cd ..
}

# Deploy backend services to Railway
deploy_backend() {
    echo ""
    echo "🚀 Deploying Backend Services to Railway..."
    echo "======================================"
    
    if ! command -v railway &> /dev/null; then
        echo "⚠️  Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Function to deploy a service
    deploy_service() {
        local service=$1
        echo ""
        echo "Deploying $service..."
        cd services/$service
        
        # Initialize if not already done
        if [ ! -f "railway.json" ]; then
            railway init --name $service
        fi
        
        # Deploy
        railway up
        
        echo "✅ $service deployed!"
        cd ../..
    }
    
    # Deploy all services
    deploy_service "auth-service"
    deploy_service "content-service"
    deploy_service "test-engine-service"
    deploy_service "qbank-service"
    deploy_service "payment-service"
    deploy_service "analytics-service"
}

# Commit changes to Git
commit_to_git() {
    echo ""
    echo "📝 Committing deployment changes to Git..."
    echo "======================================"
    
    git add -A
    git commit -m "feat: deployment configuration for Vercel and Railway"
    git push origin main
    
    echo "✅ Changes committed and pushed!"
}

# Main menu
main() {
    echo ""
    echo "Select deployment option:"
    echo "1) Deploy Frontend only (Vercel)"
    echo "2) Deploy Backend only (Railway)"
    echo "3) Deploy Full Application (Frontend + Backend)"
    echo "4) Just commit changes to Git"
    echo "5) Exit"
    echo ""
    read -p "Enter choice (1-5): " choice
    
    case $choice in
        1)
            check_tools
            deploy_frontend
            ;;
        2)
            check_tools
            deploy_backend
            ;;
        3)
            check_tools
            deploy_frontend
            deploy_backend
            commit_to_git
            ;;
        4)
            check_tools
            commit_to_git
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            main
            ;;
    esac
    
    echo ""
    echo "======================================"
    echo "✅ Deployment Complete!"
    echo "======================================"
    echo ""
    echo "Next Steps:"
    echo "1. Visit your Vercel dashboard: https://vercel.com/dashboard"
    echo "2. Visit your Railway dashboard: https://railway.app/dashboard"
    echo "3. Update environment variables with deployed service URLs"
    echo "4. Test your application at: https://eduprep.vercel.app"
    echo ""
}

# Run main function
main
