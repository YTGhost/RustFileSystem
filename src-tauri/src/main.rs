#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use disk_manager::disk::BLOCK_SIZE;
use disk_manager::{DiskManager, Fcb};
use once_cell::sync::OnceCell;
use std::fs;
use std::str;

mod disk_manager;

static mut DISKMANAGER: OnceCell<DiskManager> = OnceCell::new();

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 新建DiskManager并保存为全局变量
#[tauri::command]
fn create_new_vd_file() -> String {
    unsafe {
        DISKMANAGER.set(DiskManager::new(None));
    }
    String::from("Create success")
}

// 获取当前所在目录的文件及文件夹列表
#[tauri::command]
fn get_file_list() -> Result<Vec<Fcb>, String>  {
    Ok(DiskManager::global().cur_dir.get_file_list())
}

// 创建新文件夹
#[tauri::command]
fn create_new_directory(name: &str) -> Result<(), &'static str> {
    DiskManager::global().new_directory_to_disk(name)
}

// 创建新文件
#[tauri::command]
fn create_new_file(name: &str, data: &str) -> Result<(), &'static str> {
    DiskManager::global().create_file_with_data(name, data.as_bytes())
}

// 读取文件内容
#[tauri::command]
fn read_file_by_name(name: &str) -> String {
    let data = DiskManager::global().read_file_by_name(name);
    String::from(str::from_utf8(data.as_slice()).unwrap())
}

// 编辑文件
#[tauri::command]
fn edit_file_by_name(name: &str, data: &str) -> Result<(), &'static str> {
    DiskManager::global().delete_space_by_name(name);
    let (index, fcb) = DiskManager::global().cur_dir.get_fcb_by_name(name).unwrap();
    DiskManager::global().edit_file_by_name(index, fcb, name, data.as_bytes())
}

// 进入文件夹
#[tauri::command]
fn cd_by_name(name: &str) -> Result<(), String> {
    DiskManager::global().set_current_directory(name);
    Ok(())
}

// 删除文件或文件夹
#[tauri::command]
fn delete_file_by_name(name: &str) -> Result<(), String> {
    DiskManager::global().delete_file_by_name(name)
}

// 保存
#[tauri::command]
fn save(path: &str) -> Result<(), String> {
    let data = bincode::serialize(DiskManager::global()).unwrap();
    fs::write(path, data.as_slice()).unwrap();
    println!("The virtual disk system has been saved.\n");
    Ok(())
}

// 加载
#[tauri::command]
fn load_vd_file(path: &str) -> Result<(), String> {
    let data = fs::read(path).unwrap();
    unsafe {
        DISKMANAGER.set(bincode::deserialize(data.as_slice()).unwrap());
    }
    Ok(())
}

// 粘贴复制的文件
#[tauri::command]
fn paste_with_copy(fcb: Fcb) -> Result<(), &'static str> {
    DiskManager::global().paste_with_copy_by_fcb(&fcb, 0)
}

// 粘贴剪切的文件
#[tauri::command]
fn paste_with_cut(fcb: Fcb) -> Result<(), &'static str> {
    DiskManager::global().paste_with_cut_by_fcb(&fcb)
}

// 获取磁盘统计信息
#[tauri::command]
fn get_disk_info() -> Result<(usize, usize, usize), String> {
    let (disk_size, num_used, num_not_used) = DiskManager::global().get_disk_info();
    Ok((disk_size, num_used * BLOCK_SIZE, num_not_used * BLOCK_SIZE))
}

// 获取当前所在绝对路径
#[tauri::command]
fn get_pwd() -> Result<String, String> {
    Ok((DiskManager::global().work_dir.clone()))
}

// 文件改名
#[tauri::command]
fn rename_file(old_name: &str, new_name: &str) -> Result<(), &'static str> {
    DiskManager::global().rename_file_by_name(old_name, new_name)
}

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            create_new_vd_file,
            get_file_list,
            create_new_directory,
            create_new_file,
            read_file_by_name,
            edit_file_by_name,
            cd_by_name,
            delete_file_by_name,
            save,
            load_vd_file,
            paste_with_copy,
            paste_with_cut,
            get_disk_info,
            get_pwd,
            rename_file
        ])
        .run(context)
        .expect("error while running tauri application");
}