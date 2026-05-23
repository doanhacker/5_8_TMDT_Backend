// Mock Facebook SDK for development/testing without real Facebook App ID
// In production, replace this with real Facebook SDK

window.facebookMockMode = true;

// Initialize mock Facebook SDK
const mockFB = {
  init: function(config) {
    console.log('🔷 Mock Facebook SDK initialized (dev mode)');
    this.appId = config.appId;
  },

  login: function(callback, scope) {
    console.log('🔷 Mock Facebook Login initiated (dev mode)');
    
    // Simulate async Facebook response
    setTimeout(() => {
      const mockAccessToken = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      callback({
        authResponse: {
          accessToken: mockAccessToken,
          userID: '123456789',
          expiresIn: 5184000
        },
        status: 'connected'
      });
    }, 500);
  },

  getLoginStatus: function(callback) {
    callback({
      status: 'unknown'
    });
  },

  AppEvents: {
    logEvent: function() {}
  }
};

// Replace window.FB with mock if in dev mode
if (import.meta.env.DEV && !window.FB) {
  window.FB = mockFB;
  window.facebookMockMode = true;
  console.log('✅ Mock Facebook SDK loaded for testing');
}
