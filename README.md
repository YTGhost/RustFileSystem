# RustFileSystem

## Introduction

The RustFileSystem is a small file system with a FAT-like structure that supports functions such as creating, copying and editing files and folders, as well as providing a user-friendly GUI interface for users to operate.

The RustFileSystem consists of two parts: the front-end and the back-end, corresponding to the `src` and `src-tauri` folders in the repository respectively.

The specific features supported by The RustFileSystem are shown below:

- Create a file that can hold text information
- Create a folder
- Copy a file or folder
- Paste a copied file or folder
- Rename a file or folder
- Edit the text information stored in the file
- Delete a file or folder
- Save current status to disk
- Real-time display of the absolute path to the current directory
- View the current system status (total system space, used space and remaining space)

## General Structure

Tauri is a framework for building tiny, blazingly fast binaries for all major desktop platforms. Developers can integrate any front-end framework that compiles to HTML, JS and CSS for building their user interface. The backend of the application is a rust-sourced binary with an API that the front-end can interact with.

Thanks to the Tauri framework, we can develop RustFileSystem with a separate front-end and back-end, using React for the front-end and Rust for the back-end.

## Front-End Design

Just a basic React single page application, but unlike a normal react application, uses the `invoke` API provided by Tauri to call back-end Rust capabilities.

## Back-End Design

### Data Structure

When the system starts up, a single instance of `DiskManager` is created as the global manager. `disk` is the object where data is stored while the system is running, `cur_dir` is the folder the user is currently in, and `work_dir` is the absolute path to the directory the user is currently in.

```rust
pub struct DiskManager {
    pub disk: Disk,
    pub cur_dir: Directory,
    pub work_dir: String
}
```

`Disk` consists of `fat` and `data`. `fat` is an array of data clusters, each of which corresponds to a part of `data`. With this structure, we only have to store the serial number of the first cluster in a series of clusters, and we know all the clusters and the data they correspond to in `data`.

```rust
pub struct Disk {
  fat: Vec<FatItem>,
  data: Vec<u8>,
}
```

```rust
enum FatItem {
  NotUsed,          // Unused Cluster
  ClusterNo(usize), // Point to the next cluster
  BadCluster,       // The Bad Cluster
  EoF,              // Marking the end of a file
}
```

There are two types of files on the system: files and folders, both of which are represented via `Fcb`. According to the previous description, we only need to store the starting data cluster serial number.

```rust
pub enum FileType {
    File,
    Directory,
}
```

```rust
pub struct Fcb {
  name: String,         // File name
  file_type: FileType,  // File type
  first_cluster: usize, // Starting data cluster number
  length: usize,        // File size
}
```

```rust
pub struct Directory {
  name: String,
  files: Vec<Fcb>,
}
```

### Function Implementation

#### Create a file that can hold text information

Find the unused clusters in `fat` and write the data to the interval corresponding to these clusters in `data`, create `Fcb` based on the starting cluster number.

#### Create a directory

Just create a Direcory type `Fcb`.

#### Copy a file or directory

Just record the `Fcb` corresponding to the file or directory

#### Paste a copied file or directory

Read the data from the `Fcb` information saved at the time of copying and reuse the logic for creating new files or folders based on this information.

It is worth noting that when a folder with a multi-level structure needs to be pasted, this is done recursively.

#### Rename a file or directory

Just change the `name` field in the `Fcb` of the corresponding file or directory.

#### Edit the text information stored in the file

After marking the data cluster corresponding to this file `Fcb` as unused, reallocate the data cluster on the fat for the new file contents.

#### Delete a file or directory

Just delete `Fcb` and mark the corresponding data cluster as unused. It is worth noting that when deleting a directory with a multi-level structure, the same recursive deletion is required.

#### Save current status to disk

Using `bincode::serialize` and `bincode::deserialize`, data can be stored and read persistently.

#### Real-time display of the absolute path to the current directory

Change the `work_dir` field in `DiskManager` when entering or exiting a directory.

#### View the current system status (total system space, used space and remaining space)

Just iterate through `fat` and count the different types of `FatItem` in it.

## Getting Started

### Project setup

```bash
pnpm install
```

### Compiles and hot-reloads for development

```bash
pnpm tauri dev
```

### Compiles and minifies for production

```bash
pnpm tauri build
```
