# Use Node base
FROM node:20-bullseye

# Install Java + wget, unzip
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk wget unzip && \
    apt-get clean

# Set Android SDK root
ENV ANDROID_SDK_ROOT=/android-sdk
RUN mkdir -p /android-sdk

# Download and install Android command-line tools
RUN mkdir -p /android-sdk/cmdline-tools
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip /tmp/cmdline-tools.zip -d /android-sdk/cmdline-tools && \
    rm /tmp/cmdline-tools.zip

# Reorganize so sdkmanager lives in /android-sdk/cmdline-tools/latest/bin
RUN mkdir -p /android-sdk/cmdline-tools/latest && \
    mv /android-sdk/cmdline-tools/cmdline-tools/* /android-sdk/cmdline-tools/latest/

# Add tools to PATH
ENV PATH=$PATH:/android-sdk/cmdline-tools/latest/bin:/android-sdk/platform-tools

# Install build-tools + platform tools
RUN yes | sdkmanager --sdk_root=/android-sdk "platform-tools" "build-tools;33.0.3"

# Copy app
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

RUN mkdir -p tmp

EXPOSE 3000

CMD ["npm", "start"]
