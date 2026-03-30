.PHONY: contracts-build contracts-test backend-dev frontend-dev

# Smart Contracts
contracts-build:
	cd packages/contracts && forge build

contracts-test:
	cd packages/contracts && forge test -vv

contracts-deploy-sepolia:
	cd packages/contracts && forge script script/Deploy.s.sol --rpc-url $$BASE_SEPOLIA_RPC --broadcast

# Backend
backend-dev:
	cd packages/backend && npm run start:dev

# Frontend
frontend-dev:
	npm run dev

# Full stack
dev: frontend-dev
	@echo "Starting development servers..."

# Docker
infra-up:
	docker-compose up -d

infra-down:
	docker-compose down
