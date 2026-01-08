# ——————————————
# Base
FROM node:20-bullseye

# Install Java + wget + unzip
RUN apt-get update && apt-get install -y openjdk-17-jdk wget unzip && apt-get clean

# Android SDK base
ENV ANDROID_SDK_ROOT=/android-sdk
RUN mkdir -p $ANDROID_SDK_ROOT

# Download and setup command-line tools
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmd.zip && \
    unzip /tmp/cmd.zip -d $ANDROID_SDK_ROOT/cmdline-tools && \
    rm /tmp/cmd.zip

# Fix folder layout
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools/* $ANDROID_SDK_ROOT/cmdline-tools/latest/

# Add to PATH
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/33.0.3

# Accept licenses and install platform-tools + stable build-tools (which include apksigner)
RUN mkdir -p $ANDROID_SDK_ROOT/licenses && \
    yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses && \
    sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "build-tools;33.0.3"

# App code
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

# Create tmp
RUN mkdir tmp

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
