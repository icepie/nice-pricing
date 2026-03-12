import { App, Form, Input, InputNumber, Modal, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { api, type PriceHistory } from '../api/client'

const { Text } = Typography

interface PriceFormModalProps {
  modelId: number
  modelName: string
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function PriceFormModal({ modelId, modelName, open, onClose, onSaved }: PriceFormModalProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      api.prices.get(modelId).then((p) => form.setFieldsValue(p)).catch(() => form.resetFields())
    }
  }, [modelId, open])

  const handleOk = async () => {
    const values = await form.validateFields()
    // replace null (cleared InputNumber) with 0
    const cleaned = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === null || v === undefined ? 0 : v])
    )
    try {
      await api.prices.upsert(modelId, { ...cleaned, currency: 'USD' })
      message.success('价格已保存')
      onSaved()
      onClose()
    } catch {
      message.error('保存失败')
    }
  }

  return (
    <Modal title={`编辑价格 — ${modelName}`} open={open} onCancel={onClose} onOk={handleOk} okText="保存" cancelText="取消" width={560}>
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item label="输入价格 ($/1M)" name="input_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="输出价格 ($/1M)" name="output_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="缓存读取价格 ($/1M)" name="cache_read_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} placeholder="无则留空" />
          </Form.Item>
          <Form.Item label="缓存写入价格 ($/1M)" name="cache_write_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} placeholder="无则留空" />
          </Form.Item>
          <Form.Item label="音频输入价格 ($/1M)" name="input_audio_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} placeholder="无则留空" />
          </Form.Item>
          <Form.Item label="音频输出价格 ($/1M)" name="output_audio_price_per_1m">
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} placeholder="无则留空" />
          </Form.Item>
        </div>
        <Form.Item label="备注" name="notes">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export function PriceHistoryModal({ modelId, modelName, open, onClose }: {
  modelId: number
  modelName: string
  open: boolean
  onClose: () => void
}) {
  const [history, setHistory] = useState<PriceHistory[]>([])

  useEffect(() => {
    if (open) api.prices.history(modelId).then(setHistory)
  }, [modelId, open])

  const fmt = (v: number) => v > 0 ? <Text style={{ color: '#52c41a' }}>${v}</Text> : <Text type="secondary">—</Text>

  const columns = [
    { title: '输入', dataIndex: 'input_price_per_1m', render: fmt },
    { title: '输出', dataIndex: 'output_price_per_1m', render: fmt },
    { title: '缓存读', dataIndex: 'cache_read_price_per_1m', render: fmt },
    { title: '缓存写', dataIndex: 'cache_write_price_per_1m', render: fmt },
    { title: '音频入', dataIndex: 'input_audio_price_per_1m', render: fmt },
    { title: '音频出', dataIndex: 'output_audio_price_per_1m', render: fmt },
    { title: '记录时间', dataIndex: 'recorded_at', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ]

  return (
    <Modal title={`历史记录 — ${modelName}`} open={open} onCancel={onClose} footer={null} width={800}>
      <Table dataSource={history} columns={columns} rowKey="id" size="small" pagination={false} />
    </Modal>
  )
}
