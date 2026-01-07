# ————————————————————
# Use Node base image
FROM node:20-bullseye

# ————————————————————
# Install Java + wget + unzip
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk wget unzip && \
    apt-get clean

# ————————————————————
# Setup Android SDK root
ENV ANDROID_SDK_ROOT=/android-sdk
RUN mkdir -p /android-sdk

# ————————————————————
# Download & unpack Android command-line tools
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmd.zip && \
    unzip /tmp/cmd.zip -d $ANDROID_SDK_ROOT/cmdline-tools && \
    rm /tmp/cmd.zip

# Move tools into "latest" subfolder (required layout)
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools/* $ANDROID_SDK_ROOT/cmdline-tools/latest/

# Add Android tools to PATH
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# ————————————————————
# Accept licenses + install platform‑tools and stable build‑tools with apksigner
RUN mkdir -p $ANDROID_SDK_ROOT/licenses && \
    yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses && \
    sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "build-tools;33.0.3"

# ————————————————————
# Copy application
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

# Ensure tmp directory exists for upload sign work
RUN mkdir -p tmp

# Expose port
EXPOSE 3000

# Run server
CMD ["npm", "start"]
