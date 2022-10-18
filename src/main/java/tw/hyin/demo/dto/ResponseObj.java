package tw.hyin.demo.repo.dto;

import lombok.*;
import org.springframework.http.HttpStatus;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseObj<T> implements Serializable {

	private static final long serialVersionUID = 1L;
	
	private HttpStatus status; // success 或 error
	private List<String> errors; // 錯誤集合
	private T result; //傳送的物件

	public enum RspMsg {

		SUCCESS("成功"),
		FAILED("發生錯誤"),
		UNAUTHORIZED("驗證失敗"),
		NOT_FOUND("檔案不存在");

		@Getter
		private String msg;

		RspMsg(String msg) {
			this.msg = msg;
		}
	}
	
}
