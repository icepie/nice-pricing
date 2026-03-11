import { App, Card, Col, Row, Statistic } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Dashboard() {
  const { message } = App.useApp()
  const [stats, setStats] = useState({ providers: 0, models: 0, priced: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.providers.list(), api.models.list()])
      .then(([providers, models]) =>
        Promise.all(models.map((m) => api.prices.get(m.id).then(() => true).catch(() => false))).then((results) => {
          setStats({ providers: providers.length, models: models.length, priced: results.filter(Boolean).length })
          setLoading(false)
        }),
      )
      .catch(() => message.error('加载失败'))
  }, [])

  return (
    <>
      <h2 style={{ marginTop: 0 }}>概览</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic title="服务商" value={stats.providers} />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic title="模型总数" value={stats.models} />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic title="已录入价格" value={stats.priced} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>
    </>
  )
}
