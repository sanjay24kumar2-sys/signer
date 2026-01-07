# Use official Node.js LTS image
FROM node:20-bullseye

# Install Java (required for keytool)
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk unzip wget && \
    apt-get clean

# Install Android build-tools for apksigner
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmdline-tools.zip && \
    mkdir -p /usr/local/android/cmdline-tools && \
    unzip /tmp/cmdline-tools.zip -d /usr/local/android/cmdline-tools && \
    rm /tmp/cmdline-tools.zip

ENV ANDROID_HOME=/usr/local/android
ENV PATH=$PATH:/usr/local/android/cmdline-tools/tools/bin:/usr/local/android/cmdline-tools/latest/bin

# Install SDK build-tools
RUN yes | sdkmanager "build-tools;34.0.0"

# Copy project
WORKDIR /app
COPY package.json package.json
RUN npm install
COPY . .

# Create tmp folder for APKs
RUN mkdir tmp

EXPOSE 3000
CMD ["npm", "start"]
