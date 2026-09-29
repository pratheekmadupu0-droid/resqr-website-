import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiMiddlewarePlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = urlObj.pathname;
          
          let modulePath = null;
          if (pathname === '/api/subscription/create-order') {
            modulePath = './api/subscription/create-order.js';
          } else if (pathname === '/api/subscription/verify-payment') {
            modulePath = './api/subscription/verify-payment.js';
          } else if (pathname === '/api/subscription/status') {
            modulePath = './api/subscription/status.js';
          } else if (pathname === '/api/webhooks/razorpay') {
            modulePath = './api/webhooks/razorpay.js';
          } else if (pathname === '/api/verify') {
            modulePath = './api/verify.js';
          } else if (pathname === '/api/admin/emergency-profile') {
            modulePath = './api/admin/emergency-profile.js';
          } else if (pathname === '/api/admin/payments/sync-razorpay') {
            modulePath = './api/admin/payments/sync-razorpay.js';
          } else if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/emergency-profile')) {
            const match = pathname.match(/^\/api\/admin\/users\/([^/]+)\/emergency-profile$/);
            if (match) {
              req.params = { userId: match[1] };
              urlObj.searchParams.set('userId', match[1]);
            }
            modulePath = './api/admin/emergency-profile.js';
          }

          if (!modulePath) return next();

          // Read body if POST
          let body = {};
          if (req.method === 'POST') {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const rawBody = Buffer.concat(chunks).toString();
            try {
              body = JSON.parse(rawBody);
            } catch (e) {
              body = rawBody;
            }
          }

          req.body = body;
          req.query = Object.fromEntries(urlObj.searchParams.entries());

          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          const handlerModule = await import(/* @vite-ignore */ `${modulePath}?t=${Date.now()}`);
          const handler = handlerModule.default;
          await handler(req, res);
        } catch (err) {
          console.error('API middleware error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase SDK is large and stable — cache it separately from app code
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/analytics'],
          // Animation + QR render libraries used across the app
          vendor: ['framer-motion', 'qrcode.react', 'lucide-react'],
        },
      },
    },
  },
})
