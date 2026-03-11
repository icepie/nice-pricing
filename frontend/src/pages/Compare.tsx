import { Button, Checkbox, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { api, type AIModel, type CompareResult } from '../api/client'

const { Text } = Typography

export default function Compare() {
  const [models, setModels] = useState<AIModel[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [results, setResults] = useState<CompareResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.models.list().then(setModels) }, [])

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const compare = async () => {
    setLoading(true)
    const data = await api.compare(selected)
    setResults(data)
    setLoading(false)
  }

  const minInput = results.length
    ? Math.min(...results.filter((r) => r.price).map((r) => r.price!.input_price_per_1m))
    : Infinity
  const minOutput = results.length
    ? Math.min(...results.filter((r) => r.price).map((r) => r.price!.output_price_per_1m))
    : Infinity

  // Group by provider
  const byProvider = models.reduce<Record<string, AIModel[]>>((acc, m) => {
    const key = m.provider?.name ?? '未知'
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})

  const columns = [
    {
      title: '服务商',
      render: (_: unknown, r: CompareResult) => <Tag color="blue">{r.model.provider?.name}</Tag>,
    },
    {
      title: '模型',
      render: (_: unknown, r: CompareResult) => r.model.display_name || r.model.name,
    },
    {
      title: '输入 $/1M',
      render: (_: unknown, r: CompareResult) => {
        if (!r.price) return <Text type="secondary">—</Text>
        const isMin = r.price.input_price_per_1m === minInput
        return (
          <span>
            <Text style={{ color: '#52c41a' }}>${r.price.input_price_per_1m}</Text>
            {isMin && <Tag color="green" style={{ marginLeft: 6 }}>最低</Tag>}
          </span>
        )
      },
      onCell: (r: CompareResult) => ({
        style: r.price?.input_price_per_1m === minInput ? { background: 'rgba(82,196,26,0.08)' } : {},
      }),
    },
    {
      title: '输出 $/1M',
      render: (_: unknown, r: CompareResult) => {
        if (!r.price) return <Text type="secondary">—</Text>
        const isMin = r.price.output_price_per_1m === minOutput
        return (
          <span>
            <Text style={{ color: '#52c41a' }}>${r.price.output_price_per_1m}</Text>
            {isMin && <Tag color="green" style={{ marginLeft: 6 }}>最低</Tag>}
          </span>
        )
      },
      onCell: (r: CompareResult) => ({
        style: r.price?.output_price_per_1m === minOutput ? { background: 'rgba(82,196,26,0.08)' } : {},
      }),
    },
    {
      title: '上下文',
      render: (_: unknown, r: CompareResult) =>
        r.model.context_window ? `${(r.model.context_window / 1000).toFixed(0)}K` : '—',
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>价格对比</h2>
        <Button type="primary" disabled={selected.length < 2} loading={loading} onClick={compare}>
          对比 ({selected.length})
        </Button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>选择至少 2 个模型进行对比</div>
        {Object.entries(byProvider).map(([provider, ms]) => (
          <div key={provider} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {provider}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ms.map((m) => (
                <Checkbox
                  key={m.id}
                  checked={selected.includes(m.id)}
                  onChange={() => toggle(m.id)}
                >
                  {m.display_name || m.name}
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <Table
          dataSource={results}
          columns={columns}
          rowKey={(r) => r.model.id}
          size="small"
          pagination={false}
        />
      )}
    </>
  )
}
