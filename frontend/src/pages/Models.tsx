import { App, Badge, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { api, type AIModel, type Provider } from '../api/client'
import { PriceFormModal, PriceHistoryModal } from '../components/PriceForm'
import ProviderIcon from '../components/ProviderIcon'

const { Text } = Typography

export default function Models() {
  const { message } = App.useApp()
  const [models, setModels] = useState<AIModel[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [filterProvider, setFilterProvider] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<number[]>([])
  const [priceModal, setPriceModal] = useState<AIModel | null>(null)
  const [historyModal, setHistoryModal] = useState<AIModel | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [addForm] = Form.useForm()

  const load = () => api.models.list(filterProvider).then(setModels)

  useEffect(() => { api.providers.list().then(setProviders) }, [])
  useEffect(() => { load() }, [filterProvider])

  const filtered = useMemo(() => {
    if (!search) return models
    const q = search.toLowerCase()
    return models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.display_name || '').toLowerCase().includes(q) ||
      (m.provider?.name || '').toLowerCase().includes(q)
    )
  }, [models, search])

  const handleAddModel = async (values: Omit<AIModel, 'id' | 'provider'>) => {
    try {
      await api.models.create(values)
      message.success('模型已添加')
      setAddModal(false)
      addForm.resetFields()
      load()
    } catch {
      message.error('添加失败')
    }
  }

  const handleDelete = async (m: AIModel) => {
    await api.models.delete(m.id)
    message.success('已删除')
    load()
  }

  const handleToggle = async (m: AIModel) => {
    if (m.enabled) {
      await api.models.batchDisable([m.id])
    } else {
      await api.models.batchEnable([m.id])
    }
    load()
  }

  const handleBatchEnable = async () => {
    await api.models.batchEnable(selectedKeys)
    message.success(`已启用 ${selectedKeys.length} 个模型`)
    setSelectedKeys([])
    load()
  }

  const handleBatchDisable = async () => {
    await api.models.batchDisable(selectedKeys)
    message.success(`已禁用 ${selectedKeys.length} 个模型`)
    setSelectedKeys([])
    load()
  }

  const columns = [
    {
      title: '服务商',
      dataIndex: ['provider', 'name'],
      render: (name: string, m: AIModel) => (
        <Space size={6}>
          <ProviderIcon provider={name} iconName={m.provider?.icon || name} size={18} />
          <Tag color="blue">{name}</Tag>
        </Space>
      ),
      filters: providers.map((p) => ({ text: p.name, value: p.id })),
      onFilter: (value: unknown, record: AIModel) => record.provider_id === value,
    },
    {
      title: '模型',
      render: (_: unknown, m: AIModel) => (
        <div style={{ opacity: m.enabled ? 1 : 0.45, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProviderIcon provider={m.provider?.name || ''} iconName={m.icon || m.provider?.icon || m.provider?.name || ''} size={18} />
          <div>
            <div>{m.display_name || m.name}</div>
            {m.display_name && <Text type="secondary" style={{ fontSize: 12 }}>{m.name}</Text>}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 72,
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value: unknown, record: AIModel) => record.enabled === value,
    },
    {
      title: '上下文',
      dataIndex: 'context_window',
      render: (v: number) => v ? `${(v / 1000).toFixed(0)}K` : '—',
    },
    {
      title: '输入 $/1M',
      key: 'input',
      render: (_: unknown, m: AIModel) => <PriceCell modelId={m.id} field="input" />,
    },
    {
      title: '输出 $/1M',
      key: 'output',
      render: (_: unknown, m: AIModel) => <PriceCell modelId={m.id} field="output" />,
    },
    {
      title: '缓存读 $/1M',
      key: 'cache_read',
      render: (_: unknown, m: AIModel) => <PriceCell modelId={m.id} field="cache_read" />,
    },
    {
      title: '缓存写 $/1M',
      key: 'cache_write',
      render: (_: unknown, m: AIModel) => <PriceCell modelId={m.id} field="cache_write" />,
    },
    {
      title: '操作',
      render: (_: unknown, m: AIModel) => (
        <Space>
          <Button size="small" onClick={() => setPriceModal(m)}>编辑价格</Button>
          <Button size="small" onClick={() => setHistoryModal(m)}>历史</Button>
          <Button size="small" onClick={() => handleToggle(m)}>
            {m.enabled ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(m)} okText="删除" cancelText="取消">
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>模型管理</h2>
        <Space>
          <Input.Search
            placeholder="搜索模型名称 / 服务商"
            allowClear
            style={{ width: 220 }}
            onSearch={setSearch}
            onChange={e => !e.target.value && setSearch('')}
          />
          <Select
            placeholder="全部服务商"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => setFilterProvider(v)}
            options={providers.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Button type="primary" onClick={() => setAddModal(true)}>+ 添加模型</Button>
        </Space>
      </div>

      {selectedKeys.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text>已选 {selectedKeys.length} 个模型</Text>
          <Button size="small" type="primary" onClick={handleBatchEnable}>批量启用</Button>
          <Button size="small" onClick={handleBatchDisable}>批量禁用</Button>
          <Button size="small" type="link" onClick={() => setSelectedKeys([])}>取消选择</Button>
        </div>
      )}

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as number[]),
        }}
      />

      {priceModal && (
        <PriceFormModal
          modelId={priceModal.id}
          modelName={priceModal.display_name || priceModal.name}
          open={!!priceModal}
          onClose={() => setPriceModal(null)}
          onSaved={load}
        />
      )}

      {historyModal && (
        <PriceHistoryModal
          modelId={historyModal.id}
          modelName={historyModal.display_name || historyModal.name}
          open={!!historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      <Modal title="添加模型" open={addModal} onCancel={() => setAddModal(false)} onOk={() => addForm.submit()} okText="保存" cancelText="取消">
        <Form form={addForm} layout="vertical" onFinish={handleAddModel}>
          <Form.Item label="服务商" name="provider_id" rules={[{ required: true, message: '请选择服务商' }]}>
            <Select options={providers.map((p) => ({ label: p.name, value: p.id }))} placeholder="选择服务商" />
          </Form.Item>
          <Form.Item label="模型标识" name="name" rules={[{ required: true }]}>
            <Input placeholder="gpt-4o" />
          </Form.Item>
          <Form.Item label="显示名称" name="display_name">
            <Input placeholder="GPT-4o" />
          </Form.Item>
          <Form.Item label="上下文窗口 (tokens)" name="context_window">
            <InputNumber style={{ width: '100%' }} placeholder="128000" />
          </Form.Item>
          <Form.Item
            label={
              <Tooltip title="使用 @lobehub/icons 的图标标识，留空则继承服务商图标，如 OpenAI.Color、Gemini 等">
                图标标识 <span style={{ color: '#999', fontWeight: 400 }}>(?)</span>
              </Tooltip>
            }
            name="icon"
          >
            <Input placeholder="留空继承服务商图标" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Input placeholder="chat,vision" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

function PriceCell({ modelId, field }: { modelId: number; field: 'input' | 'output' | 'cache_read' | 'cache_write' }) {
  const [val, setVal] = useState<number | null>(null)
  useEffect(() => {
    api.prices.get(modelId)
      .then((p) => {
        const map = {
          input: p.input_price_per_1m,
          output: p.output_price_per_1m,
          cache_read: p.cache_read_price_per_1m,
          cache_write: p.cache_write_price_per_1m,
        }
        setVal(map[field] ?? null)
      })
      .catch(() => setVal(null))
  }, [modelId, field])
  if (val === null || val === 0) return <Text type="secondary">—</Text>
  return <Text style={{ color: '#52c41a' }}>${val}</Text>
}
