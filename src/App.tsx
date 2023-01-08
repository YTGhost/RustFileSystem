import { useState } from "react";
import type { MenuProps } from 'antd';
import { Space, Dropdown, Drawer, Modal, message, Input, Form, Button} from "antd";
const { TextArea } = Input;
import 'antd/dist/reset.css';
import fileIcon from "./assets/file.png";
import directoryIcon from "./assets/folder.png";
import { invoke } from "@tauri-apps/api/tauri";
import { dialog } from "@tauri-apps/api";
import { Fcb, FileItem } from "./type";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [isLoad, setIsLoad] = useState(false)
  const [fileList, setFileList] = useState<Fcb[]>([])
  const [curSelected, setCurSelected] = useState<Fcb>()
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [form1] = Form.useForm();
  const [showModal, setShowModal] = useState(false)
  const [showRenameModal, setRenameModal] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  // 文件是否编辑
  const [isEdit, setIsEdit] = useState(false)
  const [fileItemSelected, setFileItemSelected] = useState<FileItem>()
  const [pwd, setPwd] = useState("")
  const items1: MenuProps['items'] = [
    {
      label: "新建文件",
      key: '1',
      onClick: () => {
        setIsEdit(false)
        setShowDrawer(true)
      }
    },
    {
      label: "新建文件夹",
      key: '2',
      onClick: () => {
        console.log(fileItemSelected)
        setShowModal(true)
      }
    },
    {
      label: "粘贴",
      key: '3',
      onClick: async () => {
        if (fileItemSelected === undefined) {
          return
        }
        let fcb = fileItemSelected?.fcb
        let op = fileItemSelected?.op
        if (op === "Copy") {
          await invoke("paste_with_copy", { fcb })
        } else {
          await invoke("paste_with_cut_by_fcb", { fcb })
        }
        setFileItemSelected(undefined)
        await getFileList()
      }
    }
  ]
  const items2: MenuProps['items'] = [
    {
      label: "复制",
      key: '1',
      onClick: () => {
        setFileItemSelected({
          fcb: curSelected,
          op: "Copy"
        })
      }
    },
    {
      label: "重命名",
      key: '2',
      onClick: () => {
        setRenameModal(true)
      }
    },
    {
      label: "编辑",
      key: '3',
      onClick: async () => {
        form.setFieldValue("data", await invoke("read_file_by_name", { name: curSelected?.name }))
        form.setFieldValue("name", curSelected?.name)
        setIsEdit(true)
        setShowDrawer(true)
      }
    },
    {
      label: "删除",
      key: '4',
      onClick: async () => {
        await invoke("delete_file_by_name", { name: curSelected?.name })
        await getFileList()
      }
    },
  ]
  const items3: MenuProps['items'] = [
    {
      label: "打开",
      key: 1,
      onClick: async () => {
        await invoke("cd_by_name", { name: curSelected?.name })
        await getFileList()
      }
    },
    {
      label: "复制",
      key: 2,
      onClick: () => {
        setFileItemSelected({
          fcb: curSelected,
          op: "Copy"
        })
      }
    },
    {
      label: "重命名",
      key: 4,
      onClick: () => {
        setRenameModal(true)
      }
    },
    {
      label: "删除",
      key: 5,
      onClick: async () => {
        await invoke("delete_file_by_name", { name: curSelected?.name })
        await getFileList()
      }
    }
  ]
  const items4: MenuProps['items'] = [
    {
      label: "打开",
      key: 1,
      onClick: async () => {
        await invoke("cd_by_name", { name: curSelected?.name })
        await getFileList()
      }
    },
  ]

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  async function createNewVdFile() {
    await invoke("create_new_vd_file");
    setIsLoad(true)
    getFileList()
  }

  async function getFileList() {
    let fcbList:Fcb[] = await invoke("get_file_list")
    let pwd:string = await invoke("get_pwd")
    setPwd(pwd)
    setFileList(fcbList)
  }

  async function onSubmit() {
    if(isEdit) {
      form.validateFields().then(async values => {
        await invoke("edit_file_by_name", values)
        await getFileList()
        setShowDrawer(false)
        form.resetFields();
      }).catch(info => {
        console.log(info)
        if (info instanceof Object) {
          messageApi.error({
            content: info.errorFields[0].errors[0]
          })
        } else {
          messageApi.error({
            content: "文件名称已存在！"
          })
        }
      })
    } else {
      form.validateFields().then(async values => {
        await invoke("create_new_file", values)
        await getFileList()
        setShowDrawer(false)
        form.resetFields();
      }).catch(info => {
        if (info instanceof Object) {
          messageApi.error({
            content: info.errorFields[0].errors[0]
          })
        } else {
          messageApi.error({
            content: "文件名称已存在！"
          })
        }
      })
    }
  }

  async function toSave() {
    let path = await dialog.save()
    await invoke("save", { path })
  }

  async function toShowDiskInfo() {
    let res:any = await invoke("get_disk_info")
    messageApi.info({
      content: `磁盘大小：${res[0]} Bytes，已使用：${res[1]} Bytes，未使用：${res[2]} Bytes.`
    })
  }

  async function loadVdFile() {
    let path = await dialog.open()
    await invoke("load_vd_file", { path })
    setIsLoad(true)
    getFileList()
  }

  return (
    <>
      {contextHolder}
      {
        !isLoad &&
        <div className="container">
          <h1>欢迎使用简单文件系统</h1>
          <div className="row">
            <Space>
              <button type="button" onClick={() => createNewVdFile()}>
                新建
              </button>
              <button type="button" onClick={() => loadVdFile()}>
                读取
              </button>
            </Space>
          </div>
        </div>
      }
      { isLoad &&
        <>
          <div className="topBar">
            <div>当前所在目录为：{pwd}</div>
            <div className="btnGroup">
              <Space>
                <Button onClick={toShowDiskInfo} type="primary">磁盘信息</Button>
                <Button onClick={toSave} type="primary">保存</Button>
              </Space>
            </div>
          </div>
          <Dropdown menu={{ items: items1 }} trigger={['contextMenu']}>
            <div className="fileListContainer">
              {fileList.map((item, index) => {
                return (
                  <Dropdown key={index} menu={{ items: item.file_type === "File" ? items2 : item.name !== "." && item.name !== ".." ? items3 : items4 }} trigger={['contextMenu']}>
                    <div className="fileBox" onContextMenu={e => {
                      setCurSelected(item)
                      e.stopPropagation()
                    }}>
                      {item.file_type === "File" && <img className="fileIcon" src={fileIcon}></img>}
                      {item.file_type === "Directory" && <img className="fileIcon" src={directoryIcon}></img>}
                      <div>{item.name}</div>
                    </div>
                  </Dropdown>
                )
              })}
              <p>{greetMsg}</p>
            </div>
          </Dropdown>
        </>
        
        
      }
      <Drawer 
        closable={false} 
        open={showDrawer} 
        onClose={() => setShowDrawer(false)}
        title={isEdit ? "编辑文件" : "新建文件"} 
        placement="right"
        extra={
          <Space>
            <Button onClick={onSubmit} type="primary">
              确定
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
        >
          <Form.Item
            name="name"
            label="文件名称"
            rules={[{ required: true, message: '请输入文件名称' }]}
          >
            <Input placeholder="请输入文件名称" />
          </Form.Item>
          <Form.Item
            name="data"
            label="文件内容"
            rules={[{ required: true, message: '请输入文件内容' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
      <Modal
        open={showModal}
        title="创建文件夹"
        okText="确定"
        cancelText="取消"
        onCancel={() => setShowModal(false)}
        onOk={() => {
          form1
            .validateFields()
            .then(async (values) => {
              await invoke("create_new_directory", values)
              await getFileList()
              setShowModal(false)
              form1.resetFields();
            })
            .catch(info => {
              messageApi.error({
                content: "文件名称已存在！"
              })
            });
        }}
      >
        <Form
          form={form1}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={showRenameModal}
        title="重命名"
        okText="确定"
        cancelText="取消"
        onCancel={() => setRenameModal(false)}
        onOk={() => {
          form1
            .validateFields()
            .then(async (values) => {
              form1.resetFields();
              await invoke("rename_file", { oldName: curSelected?.name, newName: values.name })
              await getFileList()
              setRenameModal(false)
            })
            .catch(info => {
              console.log(info)
              if (info instanceof Object) {
                messageApi.error({
                  content: info.errorFields[0].errors[0]
                })
              } else {
                messageApi.error({
                  content: "文件名称已存在！"
                })
              }
            });
        }}
      >
        <Form
          form={form1}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default App;
