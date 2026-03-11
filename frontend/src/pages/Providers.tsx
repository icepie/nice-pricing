import { App, Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd'
import { useEffect, useState } from 'react'
import { api, type Provider } from '../api/client'

export default function Providers() {
  const { message } = App.useApp()
  const [providers, setProviders] = useState<Provider[]>([])
  const [modal, setModal] = useState<{ open: boolean; record?: Provider }>({ open: false })
  const [form] = Form.useForm()

  const load = () => api.providers.list().then(setProviders)
  useEffect(() => { load() }, [])

  const openAdd = () => {
    form.resetFields()
    setModal({ open: true })
  }

  const openEdit = (p: Provider) => {
    form.setFieldsValue(p)
    setModal({ open: true, record: p })
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    try {
      if (modal.record) {
        await api.providers.update(modal.record.id, values)
        message.success('已更新')
      } else {
        await api.providers.create(values)
        message.success('已添加')
      }
      setModal({ open: false })
      load()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    await api.providers.delete(id)
    message.success('已删除')
    load()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '官网', dataIndex: 'website', render: (v: string) => v ? <a href={v} target="_blank" rel="noreferrer">{v}</a> : '—' },
    {
      title: '操作',
      render: (_: unknown, p: Provider) => (
        <Space>
          <Button size="small" onClick={() => openEdit(p)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(p.id)} okText="删除" cancelText="取消">
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>服务商管理</h2>
        <Button type="primary" onClick={openAdd}>+ 添加服务商</Button>
      </div>

      <Table dataSource={providers} columns={columns} rowKey="id" size="small" pagination={false} />

      <Modal
        title={modal.record ? '编辑服务商' : '添加服务商'}
        open={modal.open}
        onCancel={() => setModal({ open: false })}
        onOk={handleOk}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="OpenAI" />
          </Form.Item>
          <Form.Item label="官网" name="website">
            <Input placeholder="https://openai.com" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
