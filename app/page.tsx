export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>KCT Menswear API</h1>
      <p>This is an API-only backend server.</p>
      <h2>Available endpoints:</h2>
      <ul>
        <li>/api/health - Health check</li>
        <li>/api/auth/login - Authentication</li>
        <li>/api/customers - Customer management</li>
        <li>/api/products - Product catalog</li>
        <li>/api/orders - Order management</li>
        <li>/api/dashboard/stats - Dashboard statistics</li>
      </ul>
    </div>
  )
}