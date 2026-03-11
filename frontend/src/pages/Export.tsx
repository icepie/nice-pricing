import { Button, Tabs, Typography, message } from 'antd'
import { useEffect, useState } from 'react'

const { Text } = Typography

type TabKey = 'newapi-models' | 'newapi-vendors' | 'pricing' | 'ratio_config'

const ENDPOINTS: Record<TabKey, { label: string; url: string; desc: string }> = {
  'newapi-models': {
    label: 'new-api / models.json',
    url: '/api/newapi/models.json',
    desc: 'new-api 同步上游模型接口，配置 SYNC_UPSTREAM_BASE 指向本服务即可',
  },
  'newapi-vendors': {
    label: 'new-api / vendors.json',
    url: '/api/newapi/vendors.json',
    desc: 'new-api 同步上游服务商接口',
  },
  'pricing': {
    label: 'new-api / pricing',
    url: '/api/pricing',
    desc: 'new-api ratio_sync Type2 格式，包含 model_ratio / completion_ratio / cache_ratio 等倍率字段。在 new-api 中配置上游 Endpoint 为 /api/pricing 即可同步。',
  },
  'ratio_config': {
    label: 'new-api / ratio_config',
    url: '/api/ratio_config',
    desc: 'new-api ratio_sync Type1 格式，按倍率类型分组的 map 结构。在 new-api 中配置上游 Endpoint 为 /api/ratio_config 即可同步。',
  },
}

function countRecords(data: unknown): string {
  if (!data) return ''
  const d = (data as any)?.data
  if (Array.isArray(d)) return `${d.length} 条记录`
  if (d && typeof d === 'object') {
    const modelRatio = d.model_ratio
    if (modelRatio && typeof modelRatio === 'object') {
      return `${Object.keys(modelRatio).length} 个模型`
    }
  }
  return ''
}

function JsonPreview({ url }: { url: string }) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [url])

  const json = data ? JSON.stringify(data, null, 2) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(json)
    message.success('已复制到剪贴板')
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = url.split('/').pop()?.replace(/\?.*/, '') + '.json'
    a.click()
  }

  if (loading) return <div style={{ padding: 24, color: '#8c8c8c' }}>加载中…</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <Button size="small" onClick={handleCopy} disabled={!data}>复制 JSON</Button>
        <Button size="small" onClick={handleDownload} disabled={!data}>下载文件</Button>
        <Text type="secondary" style={{ fontSize: 12 }}>{countRecords(data)}</Text>
      </div>
      <pre style={{
        background: '#1e1e2e',
        color: '#cdd6f4',
        padding: 16,
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.6,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)',
        margin: 0,
      }}>
        {json || '(无数据)'}
      </pre>
    </div>
  )
}

export default function Export() {
  const [active, setActive] = useState<TabKey>('newapi-models')

  const tabItems = (Object.keys(ENDPOINTS) as TabKey[]).map((key) => {
    const cfg = ENDPOINTS[key]
    return {
      key,
      label: cfg.label,
      children: (
        <div>
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{cfg.desc}</Text>
            <br />
            <Text code copyable style={{ fontSize: 11 }}>{window.location.origin}{cfg.url}</Text>
          </div>
          <JsonPreview url={cfg.url} />
        </div>
      ),
    }
  })

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>数据导出</h2>
      </div>
      <Tabs activeKey={active} onChange={(k) => setActive(k as TabKey)} items={tabItems} />
    </>
  )
}
