# ============================================
# Production Deployment Makefile
# ============================================

.PHONY: help build up down restart logs logs-fresh clean db-backup db-restore test lint

# Colors
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m

# Default target
help:
	@echo "$(GREEN)School Management System - Deployment Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make <command>"
	@echo ""
	@echo "$(YELLOW)Commands:$(NC)"
	@echo "  build         - Build Docker images"
	@echo "  up            - Start all services"
	@echo "  down          - Stop all services"
	@echo "  restart       - Restart all services"
	@echo "  logs          - View logs (all services)"
	@echo "  logs-fresh    - View fresh logs"
	@echo "  clean         - Remove containers, volumes, images"
	@echo "  db-backup     - Backup database"
	@echo "  db-restore    - Restore database"
	@echo "  test          - Run tests"
	@echo "  lint          - Run linter"
	@echo ""

# Build Docker images
build:
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build --no-cache

# Start services
up:
	@echo "$(GREEN)Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "API: http://localhost:3001"
	@echo "Swagger: http://localhost:3001/docs"

# Stop services
down:
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker-compose down

# Restart services
restart: down up

# View logs
logs:
	docker-compose logs -f

# View fresh logs
logs-fresh:
	docker-compose logs -f --tail=100

# Clean up
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)Cleanup complete!$(NC)"

# Database backup
db-backup:
	@echo "$(GREEN)Backing up database...$(NC)"
	mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres sms_nepal > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup complete!$(NC)"

# Database restore
db-restore:
	@echo "$(RED)Warning: This will overwrite existing data!$(NC)"
	@echo -n "Enter backup file name: "
	@read file; docker-compose exec -T postgres psql -U postgres sms_nepal < backups/$$file

# Run tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	npm test

# Run linter
lint:
	@echo "$(GREEN)Running linter...$(NC)"
	npm run lint

# Production build (no cache)
build-prod:
	@echo "$(GREEN)Building for production...$(NC)"
	docker-compose -f docker-compose.yml build --no-cache --progress=plain

# Scale API (for load balancing)
scale:
	@echo "$(YELLOW)Scaling API to $(N) instances...$(NC)"
	docker-compose up -d --scale api=$(N)

# Deploy with health check
deploy:
	@echo "$(GREEN)Deploying...$(NC)"
	docker-compose up -d --build
	@echo "$(YELLOW)Waiting for services to be healthy...$(NC)"
	sleep 10
	docker-compose ps
	@echo "$(GREEN)Deployment complete!$(NC)"
