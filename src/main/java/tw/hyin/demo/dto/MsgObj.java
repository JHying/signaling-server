package tw.hyin.demo.repo.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * @author JHying(Rita) on 2022.
 * @description
 */
@Data
public class MsgObj implements Serializable {

    private String type;//類型
    private String receiver;//接收者
    private String sender;//傳送者
    private String msg;//傳送的訊息

    // sdp (會話協議, 傳收client的配對資訊)
    private String sdp;

    // ice (for WebRTC 會話配對, 內部整合了 STUN 與 TURN 協議)
    private Map ice;

}
