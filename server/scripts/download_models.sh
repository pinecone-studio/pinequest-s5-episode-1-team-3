#!/bin/sh
# YAMNet (MediaPipe) загварыг server/models/ руу татна. Git-д орохгүй (.gitignore: *.tflite).
set -e
cd "$(dirname "$0")/.."
mkdir -p models
if [ ! -f models/yamnet.tflite ]; then
  curl -fsSL -o models/yamnet.tflite \
    https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite
fi
echo "models/yamnet.tflite бэлэн"
