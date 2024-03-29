package tw.hyin.demo.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import tw.hyin.demo.Log;
import tw.hyin.demo.dto.MsgObj;
import org.springframework.stereotype.Component;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.text.SimpleDateFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author JHying(Rita) on 2022.
 * @description WebRTC(建立會話) + WebSocket(監聽會話請求)
 */
@Component
@ServerEndpoint(value = "/call/{username}") //配置 WebSocket 服務的進入點 (對應到開放的 api 介面)
public class WebRtcServer {

    /**
     * 連接集合
     */
    private static final Map<String, Session> sessionMap = new ConcurrentHashMap<>();

    /**
     * 用戶連線成功，存到連接集合
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("username") String username) {
        Log.info(username + " connect.");
        sessionMap.put(username, session);
    }

    /**
     * 連接關閉
     */
    @OnClose
    public void onClose(Session session) {
        for (Map.Entry<String, Session> entry : sessionMap.entrySet()) {
            if (entry.getValue() == session) {
                sessionMap.remove(entry.getKey());
                Log.info(entry.getKey() + " disconnect.");
                break;
            }
        }
    }

    /**
     * 發生錯誤
     */
    @OnError
    public void onError(Session session, Throwable error) {
        for (Map.Entry<String, Session> entry : sessionMap.entrySet()) {
            if (entry.getValue() == session) {
                sessionMap.remove(entry.getKey());
                Log.error(entry.getKey() + " error.");
                break;
            }
        }
        Log.error(error.getMessage());
    }

    /**
     * 接收到client訊息
     */
    @SneakyThrows
    @OnMessage
    public void onMessage(String message, Session session) {

        // jackson
        ObjectMapper mapper = new ObjectMapper();
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // 消息解析: JSON字符串轉物件
        MsgObj msgFromClient = mapper.readValue(message, MsgObj.class);

        //準備配對
        Session receiverSession = sessionMap.get(msgFromClient.getReceiver());
        String msgType = msgFromClient.getType();

        //呼叫的用戶不在線
        if (receiverSession == null || !sessionMap.containsKey(msgFromClient.getReceiver())) {
            MsgObj newMsg = new MsgObj();
            newMsg.setType("hangup");
            newMsg.setSender("SYSTEM");
            newMsg.setMsg("Sorry, user is not available.");
            //回傳給原訊息傳送者
            send(sessionMap.get(msgFromClient.getSender()), mapper.writeValueAsString(newMsg));
            return;
        }

        switch (msgType) {
            //發起視訊請求
            case "call_start":
                msgFromClient.setMsg(msgFromClient.getSender() + " send call_start.");
                break;

            //回應視訊請求
            case "call_back":
                msgFromClient.setMsg(msgFromClient.getSender() + " send call_back.");
                break;

            //結束通話
            case "hangup":
                msgFromClient.setMsg(msgFromClient.getSender() + " hangup.");
                break;

            //向對方傳送配對資訊
            case "answer":
            case "offer":
                msgFromClient.setMsg(msgFromClient.getSender() + " send an " + msgType + ".");
                break;

            //紀錄 ICE candidate
            case "_ice":
                msgFromClient.setMsg(msgFromClient.getSender() + " send an ice info.");
                break;
        }

        //發送給訊息接收者
        send(receiverSession, mapper.writeValueAsString(msgFromClient));
    }

    /**
     * 封裝一個send方法，發送消息到前端
     */
    @SneakyThrows
    private void send(Session session, String message) {
        session.getBasicRemote().sendText(message);
    }
}
