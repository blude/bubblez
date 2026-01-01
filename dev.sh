#!/bin/bash

# University Social Network - Development Start Script

echo "🎓 University Social Network - Development Environment"
echo "================================================="

# Function to check if process is running
is_running() {
    if lsof -i :3001 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    
    echo "⏳ Waiting for $service_name to start on port $port..."
    
    for i in {1..30}; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "⏳ Attempt $i/30..."
        sleep 1
    done
    
    echo "❌ $service_name failed to start within 30 seconds"
    return 1
}

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    cd backend
    
    # Check if already running
    if is_running; then
        echo "⚠️  Backend is already running on port 3001"
        echo "💡 To stop: kill \$(lsof -ti:3001 | cut -d' ' -f2)"
        echo "💡 To restart: npm run dev"
        return 1
    fi
    
    # Ensure database is migrated
    echo "🗄️  Ensuring database is up to date..."
    npm run migrate
    
    # Start the server
    echo "🚀 Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for service to be ready
    if wait_for_service 3001 "Backend API"; then
        echo "✅ Backend is running successfully!"
        echo "🌐 API: http://localhost:3001/api/v1"
        echo "📊 Health: http://localhost:3001/health"
        return 0
    else
        kill $BACKEND_PID 2>/dev/null
        echo "❌ Backend failed to start properly"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend application..."
    cd frontend
    
    # Check if already running
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "⚠️  Frontend is already running on port 3000"
        echo "💡 To stop: kill \$(lsof -ti:3000 | cut -d' ' -f2)"
        echo "💡 To restart: npm run dev"
        return 1
    fi
    
    # Start the frontend
    echo "🚀 Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for service to be ready
    if wait_for_service 3000 "Frontend"; then
        echo "✅ Frontend is running successfully!"
        echo "🌐 Application: http://localhost:3000"
        return 0
    else
        kill $FRONTEND_PID 2>/dev/null
        echo "❌ Frontend failed to start properly"
        return 1
    fi
}

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    
    # Kill backend
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "🛑 Stopping backend..."
        kill $(lsof -ti:3001 | cut -d' ' -f2)
    fi
    
    # Kill frontend
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "🛑 Stopping frontend..."
        kill $(lsof -ti:3000 | cut -d' ' -f2)
    fi
    
    echo "✅ All services stopped"
}

# Function to show status
show_status() {
    echo "📊 Service Status"
    echo "=================="
    
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "✅ Backend: Running on port 3001"
        echo "   🌐 API: http://localhost:3001/api/v1"
        echo "   📊 Health: http://localhost:3001/health"
    else
        echo "❌ Backend: Not running"
    fi
    
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "✅ Frontend: Running on port 3000"
        echo "   🌐 Application: http://localhost:3000"
    else
        echo "❌ Frontend: Not running"
    fi
    
    echo ""
    echo "💡 Commands:"
    echo "   ./dev.sh start-backend    - Start backend only"
    echo "   ./dev.sh start-frontend   - Start frontend only"
    echo "   ./dev.sh start-all       - Start both services"
    echo "   ./dev.sh stop           - Stop all services"
    echo "   ./dev.sh status         - Show service status"
}

# Function to run tests
run_tests() {
    echo "🧪 Running test suite..."
    cd backend
    npm test
}

# Function to show logs
show_logs() {
    echo "📋 Recent logs:"
    echo "=============="
    if [ -f "logs/app.log" ]; then
        tail -20 logs/app.log
    else
        echo "No log file found at backend/logs/app.log"
    fi
}

# Main script logic
case "${1:-help}" in
    "start-backend")
        start_backend
        ;;
    "start-frontend")
        start_frontend
        ;;
    "start-all")
        echo "🚀 Starting both backend and frontend..."
        start_backend
        sleep 2
        start_frontend
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests
        ;;
    "logs")
        show_logs
        ;;
    "help"|*)
        echo "🎓 University Social Network - Development Environment"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start-backend    Start backend server only"
        echo "  start-frontend   Start frontend application only"
        echo "  start-all       Start both backend and frontend"
        echo "  stop           Stop all running services"
        echo "  status         Show current service status"
        echo "  test            Run the test suite"
        echo "  logs            Show recent application logs"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh start-all              # Start complete development environment"
        echo "  ./dev.sh status                 # Check if services are running"
        echo ""
        echo "Environment Setup (one-time):"
        echo "  cd backend && npm install"
        echo "  cd frontend && npm install"
        echo "  cd backend && npm run migrate"
        echo ""
        exit 0
        ;;
esac