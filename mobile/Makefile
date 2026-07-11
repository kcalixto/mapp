# Exporta o APK do app mobile (React Native).
#   make apk        -> release em dist/mapp.apk
#   make apk-debug  -> debug em dist/mapp-debug.apk

# NODE_BIN := $(HOME)/.nvm/versions/node/v22.16.0/bin
# export PATH := $(NODE_BIN):$(PATH)
# export ANDROID_HOME ?= $(HOME)/Library/Android/sdk

APK_RELEASE := ./android/app/build/outputs/apk/release/app-release.apk
APK_DEBUG   := ./android/app/build/outputs/apk/debug/app-debug.apk

.PHONY: apk apk-debug clean-android

apk:
	npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
	cd ./android && ./gradlew assembleRelease
	mkdir -p dist
	cp $(APK_RELEASE) dist/mapp.apk
	@echo "APK exportado em dist/mapp.apk"
