'use client';

import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function StompProvider() {
  useEffect(() => {
    const httpEndpoint =
      process.env.NEXT_PUBLIC_SOCKJS_URL ??
      'https://java-debugger-system.onrender.com/ws'; // SockJS uses https://, not wss://

    const client = new Client({
      webSocketFactory: () => new SockJS(httpEndpoint),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log('STOMP connected');
      // adjust to your broker destinations:
      client.subscribe('/topic/debug', (msg) => {
        console.log('STOMP message:', msg.body);
      });
      // client.publish({ destination: '/app/command', body: JSON.stringify({...}) });
    };

    client.activate();
    return () => client.deactivate();
  }, []);

  return null;
}
