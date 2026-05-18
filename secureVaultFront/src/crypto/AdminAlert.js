import { useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useAdminAlerts() {
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () =>
        new SockJS("http://localhost:8080/ws"),

      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe("/topic/admin-alerts", (msg) => {
        alert(msg.body);
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);
}