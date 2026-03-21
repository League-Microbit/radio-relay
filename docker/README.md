# ARM Cross-Compilation Docker Image for MakeCode/PXT

This directory contains the Docker configuration for building an ARM
cross-compilation image used by MakeCode/PXT when compiling C++ extensions
for the micro:bit.

## What It Does

PXT (the build system behind MakeCode) automatically invokes a Docker
container to compile C++ code targeting the micro:bit's ARM Cortex-M0
processor. This image provides that compilation environment.

The image is tagged **`pxt/yotta`** and contains:

- **gcc-arm-none-eabi** — ARM cross-compiler and binutils
- **cmake** and **ninja-build** — build system tools
- **python3** and **yotta** — the yotta build tool PXT delegates to
- **srecord** (`srec_cat`) — binary/hex file manipulation

## When Is It Used?

PXT detects `.cpp` files in your project and uses this Docker image to
cross-compile them. You do not invoke the container directly — PXT
handles it automatically.

## Building the Image

```bash
cd docker && make
```

To force a full rebuild (no cache):

```bash
cd docker && make rebuild
```

The image is also built automatically by **`npm run setup`** when it is
not already present on the host.

## Make Targets

| Target    | Description                              |
|-----------|------------------------------------------|
| `build`   | Build the Docker image                   |
| `rebuild` | Build with no cache (force rebuild)      |
| `push`    | Push image to a registry (requires login)|
| `clean`   | Remove the Docker image locally          |
| `info`    | Show image information                   |
| `test`    | Build and test the container             |
| `help`    | Show help message                        |

## Troubleshooting

1. Make sure Docker is running.
2. Verify you have sufficient disk space.
3. Try `make rebuild` to rule out stale layers.
4. Check Docker build logs for specific error messages.
