# Makefile for building the ARM cross-compilation Docker image
# Used by PXT/MakeCode to compile C++ extensions for micro:bit

# Docker image name and tag
IMAGE_NAME := pxt/yotta
IMAGE_TAG := latest
FULL_IMAGE_NAME := $(IMAGE_NAME):$(IMAGE_TAG)

# Default target
.PHONY: all
all: build

# Build the Docker image
.PHONY: build
build:
	@echo "Building Docker image: $(FULL_IMAGE_NAME)"
	docker build -t $(FULL_IMAGE_NAME) .
	@echo "Docker image built successfully: $(FULL_IMAGE_NAME)"

# Build with no cache (force rebuild)
.PHONY: rebuild
rebuild:
	@echo "Rebuilding Docker image with no cache: $(FULL_IMAGE_NAME)"
	docker build --no-cache -t $(FULL_IMAGE_NAME) .
	@echo "Docker image rebuilt successfully: $(FULL_IMAGE_NAME)"

# Push the image to a registry (optional)
.PHONY: push
push: build
	@echo "Pushing Docker image: $(FULL_IMAGE_NAME)"
	docker push $(FULL_IMAGE_NAME)
	@echo "Docker image pushed successfully"

# Remove the Docker image
.PHONY: clean
clean:
	@echo "Removing Docker image: $(FULL_IMAGE_NAME)"
	docker rmi $(FULL_IMAGE_NAME) || true
	@echo "Docker image removed"

# Show image info
.PHONY: info
info:
	@echo "Docker image: $(FULL_IMAGE_NAME)"
	@docker images | grep "$(IMAGE_NAME)" || echo "Image not found locally"

# Test the container by running it
.PHONY: test
test: build
	@echo "Testing Docker container: $(FULL_IMAGE_NAME)"
	docker run --rm $(FULL_IMAGE_NAME) --help || echo "Container test completed"

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build    - Build the Docker image"
	@echo "  rebuild  - Build the Docker image with no cache"
	@echo "  push     - Push the image to registry"
	@echo "  clean    - Remove the Docker image"
	@echo "  info     - Show image information"
	@echo "  test     - Test the container"
	@echo "  help     - Show this help message"
