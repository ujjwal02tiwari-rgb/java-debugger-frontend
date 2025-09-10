
module.exports = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'https://java-debugger-system.onrender.com/api/:path*' },
      
      { source: '/ws/:path*', destination: 'https://java-debugger-system.onrender.com/ws/:path*' },
    ];
  },
};
