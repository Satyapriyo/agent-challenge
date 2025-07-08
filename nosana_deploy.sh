#!/bin/bash

# nosana_deploy.sh - Complete shell script to deploy to Nosana
# This script patches the JSON file and submits the job

set -e  # Exit immediately if any command fails

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE=""
MARKET="nvidia-3060"
TIMEOUT=30
JOB_FILE="./nos_job_def/nosana_mastra.json"
VERBOSE=false

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 --image <docker_image> [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --image IMAGE     Docker image to deploy (e.g., docker.io/user/image:tag)"
    echo ""
    echo "Options:"
    echo "  --market MARKET   Nosana GPU market (default: nvidia-3060)"
    echo "  --timeout MINS    Timeout in minutes (default: 30)"
    echo "  --file FILE       Job definition file (default: ./nos_job_def/nosana_mastra.json)"
    echo "  --verbose         Enable verbose output"
    echo "  --help            Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --image docker.io/satyapriyo/agent-challenge:latest --market nvidia-3060 --timeout 30"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --image)
            IMAGE="$2"
            shift 2
            ;;
        --market)
            MARKET="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --file)
            JOB_FILE="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$IMAGE" ]]; then
    log_error "Missing required parameter: --image"
    show_usage
    exit 1
fi

# Validate timeout is a number
if ! [[ "$TIMEOUT" =~ ^[0-9]+$ ]]; then
    log_error "Timeout must be a number: $TIMEOUT"
    exit 1
fi

# Check if job definition file exists
if [[ ! -f "$JOB_FILE" ]]; then
    log_error "Job definition file not found: $JOB_FILE"
    exit 1
fi

# Check if nosana CLI is installed
if ! command -v nosana &> /dev/null; then
    log_error "Nosana CLI not found. Please install it first:"
    echo "  npm install -g @nosana/cli"
    exit 1
fi

# Display configuration
log_info "Nosana Deployment Configuration:"
echo "  📁 Job file: $JOB_FILE"
echo "  🐳 Docker image: $IMAGE"
echo "  🎯 Market: $MARKET"
echo "  ⏱️  Timeout: $TIMEOUT minutes"
echo ""

# Create backup of original file
BACKUP_FILE="${JOB_FILE}.backup.$(date +%s)"
cp "$JOB_FILE" "$BACKUP_FILE"
log_info "Created backup: $BACKUP_FILE"

# Function to restore backup on error
restore_backup() {
    if [[ -f "$BACKUP_FILE" ]]; then
        mv "$BACKUP_FILE" "$JOB_FILE"
        log_warning "Restored original job file from backup"
    fi
}

# Set trap to restore backup on script exit/error
trap restore_backup EXIT

# Update the JSON file with the new image
log_info "Updating job definition with new image..."

if command -v jq &> /dev/null; then
    # Use jq if available (more robust JSON handling)
    if $VERBOSE; then
        log_info "Using jq to update JSON file"
    fi
    
    # Check if the JSON structure is correct
    if ! jq -e '.ops[0].args.image' "$JOB_FILE" &> /dev/null; then
        log_error "Invalid JSON structure. Expected: .ops[0].args.image"
        exit 1
    fi
    
    # Update the image field
    jq --arg img "$IMAGE" '.ops[0].args.image = $img' "$JOB_FILE" > "${JOB_FILE}.tmp"
    mv "${JOB_FILE}.tmp" "$JOB_FILE"
    
elif command -v python3 &> /dev/null; then
    # Use Python as fallback for JSON manipulation
    if $VERBOSE; then
        log_info "Using Python to update JSON file"
    fi
    
    python3 -c "
import json
import sys

try:
    with open('$JOB_FILE', 'r') as f:
        data = json.load(f)
    
    if 'ops' not in data or len(data['ops']) == 0 or 'args' not in data['ops'][0] or 'image' not in data['ops'][0]['args']:
        print('❌ Invalid JSON structure. Expected: .ops[0].args.image', file=sys.stderr)
        sys.exit(1)
    
    data['ops'][0]['args']['image'] = '$IMAGE'
    
    with open('$JOB_FILE', 'w') as f:
        json.dump(data, f, indent=2)
    
    print('✅ Updated image successfully')
except Exception as e:
    print(f'❌ Error updating JSON: {e}', file=sys.stderr)
    sys.exit(1)
"
else
    # Fallback to sed (less robust but works for simple cases)
    log_warning "Neither jq nor python3 found. Using sed (less reliable)"
    
    # Check if the image field exists
    if ! grep -q '"image"' "$JOB_FILE"; then
        log_error "Image field not found in JSON file"
        exit 1
    fi
    
    # Use sed to replace the image value
    sed -i.tmp "s|\"image\": \"[^\"]*\"|\"image\": \"$IMAGE\"|g" "$JOB_FILE"
    rm -f "${JOB_FILE}.tmp"
fi

log_success "Updated image to: $IMAGE"

# Validate the updated JSON
if command -v jq &> /dev/null; then
    if ! jq empty "$JOB_FILE" 2>/dev/null; then
        log_error "Invalid JSON after update. Restoring backup..."
        restore_backup
        exit 1
    fi
    
    if $VERBOSE; then
        log_info "Updated JSON structure:"
        jq '.ops[0].args.image' "$JOB_FILE"
    fi
fi

# Submit the job to Nosana
log_info "Submitting job to Nosana network..."

if $VERBOSE; then
    log_info "Running command: nosana job post --file \"$JOB_FILE\" --market \"$MARKET\" --timeout $TIMEOUT"
fi

# Run the nosana command
if nosana job post --file "$JOB_FILE" --market "$MARKET" --timeout "$TIMEOUT"; then
    log_success "Job submitted successfully!"
    
    # Clean up backup on success
    rm -f "$BACKUP_FILE"
    
    # Show next steps
    echo ""
    log_info "Next steps:"
    echo "  • Check job status: nosana job list"
    echo "  • View job logs: nosana job logs <job_id>"
    echo "  • Monitor job: nosana job get <job_id>"
    
    exit 0
else
    log_error "Job submission failed!"
    log_info "Job definition file has been restored to original state"
    exit 1
fi