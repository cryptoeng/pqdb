# Enter Data Helper

This tool helps with creating and filling the .yaml files with data.

There are two possible ways of using it:

## Use Packaged Build (Recommended)

Download a packaged build for your system [here](https://github.com/cryptoeng/pqdb/releases) (Currently Linux and MacOS are supported).

### Linux

Run the AppImage giving the path to the pqdb repository as a command line argument:

```
./enter-data-helper-linux.AppImage /path/to/pqdb
```

### MacOS

Extract the archive with
```
tar -xf enter-data-helper-mac.tar.gz
```

Run the application giving the path to the pqdb repository as a command line argument:
```
./enter-data-helper.app/Contents/MacOS/enter-data-helper /path/to/pqdb
```

## Use Dev-Mode

If not done already, switch to the `tools/enter-data-helper` directory.

### Requirements

* node.js (For installation instructions see [here](/README.md) under Schema Validation)
* Yarn (Installs with the above, if you use the snap package. Otherwise see [here](https://classic.yarnpkg.com/en/docs/install/))

### Installation

```
yarn install
```

### Run

```
yarn electron
```

This starts the React app and when fully loaded, opens the Electron window.
