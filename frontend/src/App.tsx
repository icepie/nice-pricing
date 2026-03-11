import { App as AntApp, ConfigProvider, Layout, Menu, theme } from 'antd'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Export from './pages/Export'
import Models from './pages/Models'
import Providers from './pages/Providers'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', label: '概览' },
  { key: '/providers', label: '服务商管理' },
  { key: '/models', label: '模型管理' },
  { key: '/export', label: '数据导出' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ padding: '20px 24px 16px', fontWeight: 700, fontSize: 15, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          AI 定价管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 28 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/models" element={<Models />} />
            <Route path="/export" element={<Export />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.defaultAlgorithm],
        token: { colorPrimary: '#6366f1', borderRadius: 6 },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
