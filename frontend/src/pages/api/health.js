// Next.js API route for health check
export default async function handler(req, res) {
  try {
    // For now, return a simple health check
    // Later this can proxy to the actual backend
    res.status(200).json({ 
      status: 'healthy', 
      message: 'Survivor Sports API is running',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}